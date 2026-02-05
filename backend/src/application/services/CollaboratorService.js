import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'
import { prisma } from '../../infrastructure/database/client.js'

export class CollaboratorService {
    constructor(repository) {
        this.repository = repository || new PrismaCollaboratorRepository()
    }
    
    async getAll(organizationId, search, availableOnly, week) {
        return this.repository.findAll(organizationId, search, availableOnly, week)
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    //TODO [Refactor][Medium] sacar de aca el tema de la pasw default no lo hago por que hay flows que dejan todo cagado si no viene la pasw 
    async create(data) {
        let userId = data.userId;
        const email = data.email || data.userName;

        if (!userId) {
             if (!email) throw new Error("UserId or Email (userName) is required");
             
             const existingUser = await prisma.user.findUnique({ 
                 where: { email },
                 select: { id: true }
             });

             if (existingUser) {
                 userId = existingUser.id;
             } else {
                 const newUser = await prisma.user.create({
                     data: {
                         email,
                         username: email,
                         password: data.password || '123456'
                     }
                 });
                 userId = newUser.id;
             }
        }

        const existingMember = await prisma.collaborator.findFirst({
            where: {
                userId,
                organizationId: data.organizationId
            }
        });

        if (existingMember) {
            throw new Error(`User is already a member of this organization.`);
        }

        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        
        const { password, userName, email: unusedEmail, ...collaboratorData } = data;

        return this.repository.create({
            ...collaboratorData,
            userId,
            userName: email
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
