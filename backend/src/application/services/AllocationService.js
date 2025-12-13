import { PrismaAllocationRepository } from '../../infrastructure/repositories/PrismaAllocationRepository.js';

export class AllocationService {
    constructor() {
        this.repository = new PrismaAllocationRepository();
    }
    
    create(data) {
        return this.repository.create(data);
    }
    
    update(id, data) {
        return this.repository.update(id, data);
    }
    
    delete(id) {
        return this.repository.delete(id);
    }
    
    addRole(allocationId, roleId) {
        return this.repository.addRole(allocationId, roleId);
    }
    
    removeRole(allocationId, roleId) {
        return this.repository.removeRole(allocationId, roleId);
    }
}
