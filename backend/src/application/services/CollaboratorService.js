import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'

export class CollaboratorService {
    constructor() {
        this.repository = new PrismaCollaboratorRepository()
    }
    
    async getAll() {
        return this.repository.findAll()
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    async create(data) {
        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        return this.repository.create(data)
    }
    
    async update(id, data) {
        if (data.joinDate) {
             data.joinDate = new Date(data.joinDate).toISOString()
        }
        return this.repository.update(id, data)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addSkill(collaboratorId, skillId, level) {
         return this.repository.addSkill(collaboratorId, skillId, level)
    }
    
    async removeSkill(collaboratorId, skillId) {
        return this.repository.removeSkill(collaboratorId, skillId)
    }

    async addHardware(data) {
        return this.repository.addHardware(data)
    }

    async removeHardware(id) {
        return this.repository.removeHardware(id)
    }

    async updateHolidayCalendar(data) {
        return this.repository.updateHolidayCalendar(data)
    }
}
