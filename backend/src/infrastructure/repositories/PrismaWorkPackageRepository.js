import { prisma } from '../database/client.js'

export class PrismaWorkPackageRepository {
    async findByProjectId(projectId) {
        return prisma.workPackage.findMany({
            where: { projectId },
            include: {
                tasks: {
                    include: {
                        estimations: { include: { role: true } },
                        collaborator: true
                    }
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
                        estimations: { include: { role: true } },
                        collaborator: true
                    }
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

    async update(id, data) {
        return prisma.workPackage.update({
            where: { id },
            data,
            include: { tasks: true }
        })
    }

    async delete(id) {
        await prisma.workPackage.delete({ where: { id } })
        return true
    }
}
