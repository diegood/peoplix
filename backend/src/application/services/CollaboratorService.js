import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'
import { prisma } from '../../infrastructure/database/client.js'

export class CollaboratorService {
    constructor(repository) {
        this.repository = repository || new PrismaCollaboratorRepository()
    }
    
    async getAll(organizationId, search) {
        return this.repository.findAll(organizationId, search)
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    async create(data) {
        const email = data.userName;
        if (!email) throw new Error("Email (userName) is required");
        
        let userId;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
            userId = existingUser.id;
        } else {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: data.password || '123456'
                }
            });
            userId = newUser.id;
        }

        const existingMember = await prisma.collaborator.findFirst({
            where: {
                userId,
                organizationId: data.organizationId
            }
        });

        if (existingMember) {
            throw new Error(`User ${email} is already a member of this organization.`);
        }

        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        
        const { password, ...collaboratorData } = data;

        return this.repository.create({
            ...collaboratorData,
            userId
        })
    }
    
    async update(id, data) {
        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }

        const { password, ...collaboratorData } = data;

        if (password) {
            const collaborator = await this.repository.findById(id);
            if (collaborator && collaborator.userId) {
                await prisma.user.update({
                    where: { id: collaborator.userId },
                    data: { password }
                });
            }
        }

        if (Object.keys(collaboratorData).length === 0) {
            return this.repository.findById(id);
        }

        return this.repository.update(id, collaboratorData)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addSkill(collaboratorId, skillId, level) {
         return this.repository.addSkill(collaboratorId, skillId, level)
    }
    
    async removeSkill(collaboratorId, skillId) {
        return this.repository.removeSkill(collaboratorId, skillId)
    }

    async addHardware(data) {
        return this.repository.addHardware(data)
    }

    async removeHardware(id) {
        return this.repository.removeHardware(id)
    }

    async updateHolidayCalendar(data) {
        return this.repository.updateHolidayCalendar(data)
    }

    async addCareerObjective(collaboratorId, year, quarter, description, skillId, targetLevel) {
        return this.repository.addCareerObjective({
            collaboratorId,
            year,
            quarter,
            description,
            status: 'PENDING',
            skillId,
            targetLevel
        })
    }

    async updateCareerObjective(id, status) {
        return this.repository.updateCareerObjective(id, { status })
    }

    async deleteCareerObjective(id) {
        return this.repository.deleteCareerObjective(id)
    }

    async addMeeting(collaboratorId, date, notes) {
        return this.repository.addMeeting({
            collaboratorId,
            date: new Date(date),
            notes
        })
    }

    async updateMeeting(id, data) {
        if (data.date) {
            data.date = new Date(data.date)
        }
        return this.repository.updateMeeting(id, data)
    }

    async deleteMeeting(id) {
        return this.repository.deleteMeeting(id)
    }

    async addMeetingActionItem(meetingId, description) {
        return this.repository.addActionItem({
            meetingId,
            description,
            status: 'PENDING'
        })
    }

    async updateMeetingActionItem(id, data) {
        return this.repository.updateActionItem(id, data)
    }

    async deleteMeetingActionItem(id) {
        return this.repository.deleteActionItem(id)
    }
}
