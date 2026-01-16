import { PrismaCollaboratorHierarchyRepository } from '../../infrastructure/repositories/PrismaCollaboratorHierarchyRepository.js'

export class CollaboratorHierarchyService {
    constructor(collaboratorHierarchyRepository = new PrismaCollaboratorHierarchyRepository()) {
        this.repository = collaboratorHierarchyRepository
    }

    async getHierarchy(organizationId) {
        return this.repository.findAll(organizationId)
    }

    async createRelation(data) {
        return this.repository.create(data)
    }

    async deleteRelation(id) {
        return this.repository.delete(id)
    }
}
