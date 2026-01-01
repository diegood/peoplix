import { prisma } from '../database/client.js'

export class PrismaAllocationRepository {
    async create(data) {
        
        const { projectId, collaboratorId, dedicationPercentage, startWeek, endWeek, roleId } = data
        
        return prisma.allocation.create({
            data: {
                projectId,
                collaboratorId,
                dedicationPercentage,
                startWeek,
                endWeek,
                roles: {
                    create: { roleId }
                }
            },
            include: {
                roles: { include: { role: true } },
                collaborator: true,
                project: true
            }
        })
    }

    async update(id, data) {
        return prisma.allocation.update({
            where: { id },
            data,
            include: { roles: { include: { role: true } } }
        })
    }

    async delete(id) {
        await prisma.allocation.delete({ where: { id } })
        return true
    }
    
    async addRole(allocationId, roleId) {
        await prisma.allocationRole.create({
            data: { allocationId, roleId }
        })
        return prisma.role.findUnique({ where: { id: roleId } }) 
    }
    
    async removeRole(allocationId, roleId) {
        await prisma.allocationRole.delete({
            where: {
                allocationId_roleId: { allocationId, roleId }
            }
        })
        return true
    }

    async addHierarchy(subordinateId, supervisorId, hierarchyTypeId) {
        return prisma.allocationHierarchy.create({
            data: {
                subordinateId,
                supervisorId,
                hierarchyTypeId
            },
            include: { hierarchyType: true }
        })
    }

    async removeHierarchy(id) {
        await prisma.allocationHierarchy.delete({ where: { id } })
        return true
    }
    
    async findRoles(allocationId) {
         const rs = await prisma.allocationRole.findMany({
            where: { allocationId },
            include: { role: true }
        })
        return rs.map(ar => ar.role)
    }
    
    async findSupervisors(subordinateId) {
        return prisma.allocationHierarchy.findMany({
            where: { subordinateId },
            include: { 
                hierarchyType: true,
                supervisor: { include: { collaborator: true } }
            }
        })
    }
    
    async findSubordinates(supervisorId) {
        return prisma.allocationHierarchy.findMany({
            where: { supervisorId },
            include: { 
                hierarchyType: true,
                subordinate: { include: { collaborator: true } }
            }
        })
    }
}
