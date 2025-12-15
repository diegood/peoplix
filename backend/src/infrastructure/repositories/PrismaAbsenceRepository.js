import { prisma } from '../database/client.js'

export class PrismaAbsenceRepository {
    // Absence Types
    async findAllTypes() { return prisma.absenceType.findMany() }
    async createType(data) { return prisma.absenceType.create({ data }) }
    async updateType(id, data) { return prisma.absenceType.update({ where: { id }, data }) }
    async deleteType(id) { await prisma.absenceType.delete({ where: { id } }); return true }

    // Absences
    async findAbsences({ collaboratorId, projectId, startDate, endDate }) {
        const where = {}
        if (collaboratorId) where.collaboratorId = collaboratorId
        if (projectId) {
            // Find collaborators in this project (using implicit Relation or allocations?)
            // Absence -> Collaborator. Collaborator -> Allocations -> Project.
            // Prisma "some" filter:
            where.collaborator = {
                allocations: {
                    some: { projectId }
                }
            }
        }
        if (startDate && endDate) {
            where.startDate = { lte: new Date(endDate) }
            where.endDate = { gte: new Date(startDate) }
        }
        
        return prisma.absence.findMany({ 
            where,
            include: { type: true, collaborator: true },
            orderBy: { startDate: 'desc' }
        })
    }

    async createAbsence(data) { 
        return prisma.absence.create({ 
            data,
            include: { type: true, collaborator: true }
        }) 
    }

    async updateStatus(id, status) {
        return prisma.absence.update({
            where: { id },
            data: { status },
            include: { type: true, collaborator: true }
        })
    }

    async deleteAbsence(id) { 
        await prisma.absence.delete({ where: { id } })
        return true 
    }
}
