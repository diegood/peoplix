import { prisma } from '../database/client.js'

const RECORD_NOT_FOUND_ERROR_CODE = 'P2025'

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
                },
                recurrentEvents: true
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
                },
                recurrentEvents: true
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

    async createFromRequirements({ projectId, name, description, highLevelEstimation, startDate, requirementIds }) {
        return prisma.$transaction(async (tx) => {
            const workPackage = await tx.workPackage.create({
                data: {
                    projectId,
                    name,
                    description,
                    highLevelEstimation,
                    startDate,
                    status: 'BACKLOG'
                }
            })

            if (Array.isArray(requirementIds) && requirementIds.length > 0) {
                const requirements = await tx.functionalRequirement.findMany({
                    where: { id: { in: requirementIds } },
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        description: true,
                        generalDescription: true,
                        detailedFlow: true
                    }
                })

                const tasksData = requirements.map((req) => ({
                    workPackageId: workPackage.id,
                    functionalRequirementId: req.id,
                    name: `RF-${req.number}: ${req.title}`,
                    description: req.description || req.generalDescription || req.detailedFlow || 'Sin detalle'
                }))

                if (tasksData.length > 0) {
                    await tx.task.createMany({ data: tasksData })
                }
            }

            return tx.workPackage.findUnique({
                where: { id: workPackage.id },
                include: {
                    tasks: {
                        include: {
                            estimations: { include: { role: true, collaborator: true } },
                            collaborator: true,
                            functionalRequirement: true
                        }
                    }
                }
            })
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

    async createRecurrentEvent(data) {
        return prisma.workPackageRecurrentEvent.create({ data })
    }

    async deleteRecurrentEvent(id) {
        try {
            await prisma.workPackageRecurrentEvent.delete({ where: { id } })
            return true
        } catch (e) {
            if (e.code === RECORD_NOT_FOUND_ERROR_CODE) return true
            throw e
        }
    }

    async delete(id) {
        await prisma.workPackage.delete({ where: { id } })
        return true
    }
}
