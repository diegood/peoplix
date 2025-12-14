import { prisma } from '../database/client.js'

export class PrismaAllocationRepository {
    async create(data) {
        // data expects: { projectId, collaboratorId, dedicationPercentage, startWeek, endWeek, roleId }
        // The service layer should prepare the data structure for Prisma
        // But here we can accept raw args or structured data. 
        // Let's assume generic create data passed from Service.
        // However, the current resolver does specific nesting.
        // Let's stick to the current resolver logic but encapsulated.
        
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
        // Return only the role as per schema
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

    // Hierarchy
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
    
    // Field resolvers support
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
