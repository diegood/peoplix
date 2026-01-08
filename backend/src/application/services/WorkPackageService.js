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

    async createFromRequirements(data) {
        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }
        return this.repository.createFromRequirements(data)
    }

    async update(id, data, userId = null) {
        const current = await this.repository.findById(id)
        if (!current) throw new Error('Work Package not found')

        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }

        const result = await this.repository.update(id, data)

        if (data.status && data.status !== current.status) {
            await this.repository.createHistory({
                workPackageId: id,
                field: 'STATUS',
                oldValue: current.status,
                newValue: data.status,
                userId: userId
            })
        }

        return result
    }

    async createRecurrentEvent(data) {
        if (data.startDate) data.startDate = new Date(data.startDate)
        if (data.endDate) data.endDate = new Date(data.endDate)
        if (data.date) data.date = new Date(data.date)
        
        return this.repository.createRecurrentEvent(data)
    }

    async deleteRecurrentEvent(id) {
        return this.repository.deleteRecurrentEvent(id)
    }

    async delete(id) {
        return this.repository.delete(id)
    }
}
