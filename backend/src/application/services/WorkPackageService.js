import { PrismaWorkPackageRepository } from '../../infrastructure/repositories/PrismaWorkPackageRepository.js'

export class WorkPackageService {
    constructor(repository) {
        this.repository = repository || new PrismaWorkPackageRepository()
    }

    async get(id) {
        return this.repository.findById(id)
    }

    async getByProject(projectId, status = null) {
        return this.repository.findByProjectId(projectId, status)
    }

    async create(data) {
        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }
        return this.repository.create(data)
    }

    async update(id, data) {
        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }
        return this.repository.update(id, data)
    }

    async delete(id) {
        return this.repository.delete(id)
    }
}
