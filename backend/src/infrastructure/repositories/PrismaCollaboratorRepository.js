import { prisma } from '../database/client.js'

export class PrismaCollaboratorRepository {
    async findAll() {
        return prisma.collaborator.findMany({
            include: {
                skills: { include: { skill: true } },
                allocations: { include: { project: true } },
                roles: { include: { role: true } },
                hardware: true,
                holidayCalendar: true,
                customFieldValues: { include: { fieldDefinition: true } },
                workCenter: true
            }
        })
    }

    async findById(id) {
        return prisma.collaborator.findUnique({
            where: { id },
            include: {
                skills: { include: { skill: true } },
                allocations: true,
                roles: { include: { role: true } },
                hardware: true,
                holidayCalendar: true,
                customFieldValues: { include: { fieldDefinition: true } },
                workCenter: true
            }
        })
    }

    async create(data) {
        return prisma.collaborator.create({
            data,
            include: {
                skills: { include: { skill: true } },
                hardware: true,
                holidayCalendar: true,
                customFieldValues: { include: { fieldDefinition: true } }
            }
        })
    }

    async update(id, data) {
        return prisma.collaborator.update({
            where: { id },
            data,
             include: {
                skills: { include: { skill: true } }
            }
        })
    }

    async delete(id) {
        await prisma.collaborator.delete({ where: { id } })
        return true
    }

    // Relation management methods
    async addSkill(collaboratorId, skillId, level) {
         await prisma.collaboratorSkill.upsert({
            where: {
                collaboratorId_skillId: { collaboratorId, skillId }
            },
            update: { level },
            create: { collaboratorId, skillId, level }
        })
        
        // Record history
        await prisma.collaboratorSkillHistory.create({
            data: {
                collaboratorId,
                skillId,
                level
            }
        })

        return this.findById(collaboratorId)
    }

    async removeSkill(collaboratorId, skillId) {
        await prisma.collaboratorSkill.delete({
            where: {
                collaboratorId_skillId: { collaboratorId, skillId }
            }
        })
        return true
    }

    // Hardware
    async addHardware(data) {
        return prisma.hardware.create({ data })
    }

    async removeHardware(id) {
        await prisma.hardware.delete({ where: { id } })
        return true
    }

    // Holiday Calendar
    async updateHolidayCalendar({ collaboratorId, year, holidays }) {
        const holidaysJson = JSON.stringify(holidays)
        const existing = await prisma.holidayCalendar.findUnique({
             where: { collaboratorId_year: { collaboratorId, year } }
        })
        
        if (existing) {
             return prisma.holidayCalendar.update({
                 where: { id: existing.id },
                 data: { holidays: holidaysJson }
             })
        }
        return prisma.holidayCalendar.create({
            data: { collaboratorId, year, holidays: holidaysJson }
        })
    }

    // Career Objectives
    async addCareerObjective(data) {
        return prisma.collaboratorCareerObjective.create({ data })
    }

    async updateCareerObjective(id, data) {
        return prisma.collaboratorCareerObjective.update({
            where: { id },
            data
        })
    }

    async deleteCareerObjective(id) {
        await prisma.collaboratorCareerObjective.delete({ where: { id } })
        return true
    }

    // Meetings
    async addMeeting(data) {
        return prisma.collaboratorMeeting.create({ 
            data,
            include: { actionItems: true }
        })
    }

    async updateMeeting(id, data) {
        return prisma.collaboratorMeeting.update({
            where: { id },
            data,
            include: { actionItems: true }
        })
    }

    async deleteMeeting(id) {
        await prisma.collaboratorMeeting.delete({ where: { id } })
        return true
    }

    // Action Items
    async addActionItem(data) {
        return prisma.meetingActionItem.create({ data })
    }

    async updateActionItem(id, data) {
        return prisma.meetingActionItem.update({
            where: { id },
            data
        })
    }

    async deleteActionItem(id) {
        await prisma.meetingActionItem.delete({ where: { id } })
        return true
    }
}
