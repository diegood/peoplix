import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository.js'

export class ProjectService {
    constructor(repository) {
        this.repository = repository || new PrismaProjectRepository()
    }
    
    async getAll(orgId, args) {
        return this.repository.findAll(orgId, args)
    }
    
    async getById(id) {
        return this.repository.findById(id)
    }
    
    async create(data) {
        return this.repository.create(data) // data contains orgId
    }
    
    async update(id, data) {
        return this.repository.update(id, data)
    }
    
    async delete(id) {
        return this.repository.delete(id)
    }
    
    async addRequirement(data) {
        return this.repository.addRequirement(data)
    }

    async updateRequirement(id, data) {
        return this.repository.updateRequirement(id, data)
    }

    async removeRequirement(id) {
        return this.repository.removeRequirement(id)
    }

    async addRequirementSkill(requirementId, skillName, level, orgId) {
        return this.repository.addRequirementSkill(requirementId, skillName, level, orgId)
    }

    async removeRequirementSkill(requirementId, skillId) {
        return this.repository.removeRequirementSkill(requirementId, skillId)
    }

    async createMilestone(data) {
        return this.repository.createMilestone(data)
    }

    async deleteMilestone(id) {
        return this.repository.deleteMilestone(id)
    }
}
