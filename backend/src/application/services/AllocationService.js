import { PrismaAllocationRepository } from '../../infrastructure/repositories/PrismaAllocationRepository.js'

export class AllocationService {
    constructor() {
        this.repository = new PrismaAllocationRepository()
    }
    
    async create(data) {
        return this.repository.create({
            projectId: data.projectId,
            collaboratorId: data.collaboratorId,
            dedicationPercentage: data.percentage,
            roleId: data.roleId,
            startWeek: data.startWeek,
            endWeek: data.endWeek
        })
    }
    
    async update(id, data) {
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
    
    async addHierarchy(subordinateId, supervisorId, typeId) {
        return this.repository.addHierarchy(subordinateId, supervisorId, typeId)
    }
    
    async removeHierarchy(id) {
        return this.repository.removeHierarchy(id)
    }
    
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
