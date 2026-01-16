import { prisma } from '../database/client.js'

export class PrismaCollaboratorHierarchyRepository {
    async create(data) {
        return prisma.collaboratorHierarchy.create({ data })
    }

    async delete(id) {
        return prisma.collaboratorHierarchy.delete({ where: { id } })
    }

    async findAll(organizationId) {
        return prisma.collaboratorHierarchy.findMany({
            where: { organizationId },
            include: {
                supervisor: {
                    include: { roles: true }
                },
                subordinate: {
                    include: { roles: true }
                },
                hierarchyType: true
            }
        })
    }
}
