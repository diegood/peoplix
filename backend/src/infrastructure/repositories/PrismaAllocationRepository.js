import { prisma } from '../database/prisma.js';
import { Allocation } from '../../domain/entities/Allocation.js';

export class PrismaAllocationRepository {
    async create({ projectId, collaboratorId, roleId, percentage, startWeek }) {
        const allocation = await prisma.allocation.create({
            data: {
                projectId,
                collaboratorId,
                dedicationPercentage: percentage,
                startWeek,
                endWeek: null,
                roles: {
                    create: { roleId }
                }
            },
            include: {
                roles: { include: { role: true } },
                collaborator: true,
                project: true
            }
        });
        
        return this._toEntity(allocation);
    }
    
    async update(id, { percentage, endWeek }) {
         const data = {};
         if (percentage !== undefined) data.dedicationPercentage = percentage;
         if (endWeek !== undefined) data.endWeek = endWeek;
         
         const updated = await prisma.allocation.update({
             where: { id },
             data,
             include: { roles: { include: { role: true } } }
         });
         return this._toEntity(updated);
    }
    
    async delete(id) {
        await prisma.allocation.delete({ where: { id } });
        return id;
    }
    
    async addRole(allocationId, roleId) {
        await prisma.allocationRole.create({
            data: { allocationId, roleId }
        });
        // Return simple role object or fetch full? Logic needs just Role
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        return role;
    }
    
    async removeRole(allocationId, roleId) {
        await prisma.allocationRole.delete({
             where: { allocationId_roleId: { allocationId, roleId } }
        });
        return roleId;
    }

    _toEntity(a) {
        const roles = a.roles ? a.roles.map(ar => ar.role) : [];
        return new Allocation({ ...a, roles });
    }
}
