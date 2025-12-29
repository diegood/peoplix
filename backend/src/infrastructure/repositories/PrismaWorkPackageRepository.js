import { prisma } from '../database/client.js'


export class PrismaWorkPackageRepository {
    async findByProjectId(projectId, status = null) {
        const where = { projectId }
        if (status) {
            where.status = status
        }
        return prisma.workPackage.findMany({
            where,
            include: {
                tasks: {
                    include: {
                        estimations: { include: { role: true, collaborator: true } },
                        collaborator: true
                    }
                },
                history: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    }
    
    async findById(id) {
        return prisma.workPackage.findUnique({
            where: { id },
             include: {
                tasks: {
                    include: {
                        estimations: { include: { role: true, collaborator: true } },
                        collaborator: true
                    }
                },
                history: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
    }

    async create({ projectId, name, description, highLevelEstimation, startDate }) {
        return prisma.workPackage.create({
            data: { 
                projectId, 
                name, 
                description, 
                highLevelEstimation,
                startDate,
                status: 'BACKLOG'
            },
           include: { tasks: true }
        })
    }

    async update(id, data, userId = null) {
        return prisma.workPackage.update({
            where: { id },
            data,
            include: { tasks: true, history: true }
        })
    }

    async createHistory(data) {
        return prisma.workPackageHistory.create({ data })
    }

    async delete(id) {
        await prisma.workPackage.delete({ where: { id } })
        return true
    }
}
