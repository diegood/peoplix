import { prisma } from '../database/client.js'

export class PrismaResponsibilityRepository {
    async create(data) {
        return prisma.responsibility.create({
            data: {
                role: data.role,
                projectId: data.projectId,
                allocationId: data.allocationId,
                workPackageId: data.workPackageId,
                functionalRequirementId: data.functionalRequirementId,
                targetAllocationId: data.targetAllocationId
            },
            include: {
                allocation: { include: { collaborator: true } },
                workPackage: true,
                functionalRequirement: true,
                targetAllocation: { include: { collaborator: true } },
                project: true
            }
        })
    }

    async delete(id) {
        await prisma.responsibility.delete({ where: { id } })
        return true
    }

    async findByProject(projectId) {
        return prisma.responsibility.findMany({
            where: { projectId },
            include: {
                allocation: { include: { collaborator: true } },
                workPackage: true,
                functionalRequirement: true,
                targetAllocation: { include: { collaborator: true } }
            }
        })
    }
}
