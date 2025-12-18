import { prisma } from '../database/client.js'

export class PrismaTaskRepository {
    async findById(id) {
        return prisma.task.findUnique({
            where: { id },
            include: {
                estimations: { include: { role: true } },
                collaborator: true,
                workPackage: true,
                dependencies: true,
                dependents: true
            }
        })
    }

    async create({ workPackageId, name, description, startDate, collaboratorId }) {
        return prisma.task.create({
            data: {
                workPackageId,
                name,
                description,
                startDate,
                collaboratorId
            },
            include: {
                estimations: { include: { role: true } },
                collaborator: true
            }
        })
    }

    async update(id, data) {
        return prisma.task.update({
            where: { id },
            data,
            include: {
                estimations: { include: { role: true } },
                collaborator: true
            }
        })
    }

    async delete(id) {
        await prisma.task.delete({ where: { id } })
        return true
    }

    async saveEstimation({ taskId, roleId, hours, startDate, endDate }) {
        const data = { hours }
        if (startDate) data.startDate = startDate
        if (endDate) data.endDate = endDate

        return prisma.taskEstimation.upsert({
            where: {
                taskId_roleId: { taskId, roleId }
            },
            update: data,
            create: { taskId, roleId, hours, startDate, endDate },
            include: { role: true }
        })
    }
}
