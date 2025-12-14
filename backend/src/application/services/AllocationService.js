import { PrismaAllocationRepository } from '../../infrastructure/repositories/PrismaAllocationRepository.js'

export class AllocationService {
    constructor() {
        this.repository = new PrismaAllocationRepository()
    }
    
    // Pass-through create with potential business logic in future
    async create(data) {
        // data: { projectId, collaboratorId, roleId, percentage, startWeek }
        // Transform percentage to dedicationPercentage if needed, but repository expects fields.
        // The resolver will likely map args to this structure.
        return this.repository.create({
            projectId: data.projectId,
            collaboratorId: data.collaboratorId,
            dedicationPercentage: data.percentage, // Mapping here or in resolver? Let's do it here for consistency if repo expects dedicationPercentage
            roleId: data.roleId,
            startWeek: data.startWeek,
            endWeek: data.endWeek
        })
    }
    
    async update(id, data) {
         // Map percentage -> dedicationPercentage
         const updateData = {}
         if (data.percentage !== undefined) updateData.dedicationPercentage = data.percentage
         if (data.endWeek !== undefined) updateData.endWeek = data.endWeek
         if (data.startWeek !== undefined) updateData.startWeek = data.startWeek
         
         return this.repository.update(id, updateData)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addRole(allocationId, roleId) {
        return this.repository.addRole(allocationId, roleId)
    }
    
    async removeRole(allocationId, roleId) {
        return this.repository.removeRole(allocationId, roleId)
    }
    
    // Hierarchy
    async addHierarchy(subordinateId, supervisorId, typeId) {
        return this.repository.addHierarchy(subordinateId, supervisorId, typeId)
    }
    
    async removeHierarchy(id) {
        return this.repository.removeHierarchy(id)
    }
    
    // Getters for field resolvers
    async getRoles(allocationId) {
        return this.repository.findRoles(allocationId)
    }
    
    async getSupervisors(subordinateId) {
        return this.repository.findSupervisors(subordinateId)
    }
    
    async getSubordinates(supervisorId) {
        return this.repository.findSubordinates(supervisorId)
    }
}
