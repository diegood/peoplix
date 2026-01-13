import { PrismaResponsibilityRepository } from '../../infrastructure/repositories/PrismaResponsibilityRepository.js'

export class ResponsibilityService {
    constructor(repository) {
        this.repository = repository || new PrismaResponsibilityRepository()
    }

    async create(data) {
        return this.repository.create(data)
    }

    async delete(id) {
        return this.repository.delete(id)
    }

    async getByProject(projectId) {
        return this.repository.findByProject(projectId)
    }
}
