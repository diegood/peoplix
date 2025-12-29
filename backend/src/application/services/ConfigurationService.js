import { 
    PrismaRoleRepository, 
    PrismaSkillRepository, 
    PrismaTechnologyRepository, 
    PrismaMilestoneTypeRepository,
    PrismaHierarchyTypeRepository,
    PrismaCustomFieldRepository,
    PrismaWorkPackageStatusRepository
} from '../../infrastructure/repositories/PrismaConfigurationRepositories.js'

import { PrismaCollaboratorRepository } from '../../infrastructure/repositories/PrismaCollaboratorRepository.js'

export class ConfigurationService {
    constructor(repositories = {}) {
        this.roles = repositories.roles || new PrismaRoleRepository()
        this.skills = repositories.skills || new PrismaSkillRepository()
        this.technologies = repositories.technologies || new PrismaTechnologyRepository()
        this.milestoneTypes = repositories.milestoneTypes || new PrismaMilestoneTypeRepository()
        this.hierarchyTypes = repositories.hierarchyTypes || new PrismaHierarchyTypeRepository()
        this.customFields = repositories.customFields || new PrismaCustomFieldRepository()
        this.workPackageStatuses = repositories.workPackageStatuses || new PrismaWorkPackageStatusRepository()
        this.collaboratorRepository = repositories.collaboratorRepository || new PrismaCollaboratorRepository()
    }
    
    async getRoles(orgId) { return this.roles.findAll(orgId) }
    async createRole(name, orgId) { return this.roles.create({ name, organizationId: orgId }) }
    async deleteRole(id) { return this.roles.delete(id) }

    async getSkills(orgId) { return this.skills.findAll(orgId) }
    async createSkill(name, orgId) { return this.skills.create({ name, organizationId: orgId }) }
    async deleteSkill(id) { return this.skills.delete(id) }

    async getTechnologies(orgId) { return this.technologies.findAll(orgId) }
    async createTechnology(name, orgId) { return this.technologies.create({ name, organizationId: orgId }) }
    async deleteTechnology(id) { return this.technologies.delete(id) }

    async getMilestoneTypes(orgId) { return this.milestoneTypes.findAll(orgId) }
    async createMilestoneType(data) { return this.milestoneTypes.create(data) }
    async updateMilestoneType(id, data) { return this.milestoneTypes.update(id, data) }
    async deleteMilestoneType(id) { return this.milestoneTypes.delete(id) }
    
    async getHierarchyTypes(orgId) { return this.hierarchyTypes.findAll(orgId) }
    async createHierarchyType(data) { return this.hierarchyTypes.create(data) }
    async updateHierarchyType(id, data) { return this.hierarchyTypes.update(id, data) }
    async deleteHierarchyType(id) { return this.hierarchyTypes.delete(id) }

    async getCustomFieldDefinitions(orgId) { return this.customFields.findAll(orgId) }
    async createCustomFieldDefinition(data) { return this.customFields.create(data) }
    async updateCustomFieldDefinition(id, data) { return this.customFields.update(id, data) }
    async deleteCustomFieldDefinition(id) { return this.customFields.delete(id) }
    async setCustomFieldValue(data) { 
        await this.customFields.setValue(data)
        return this.collaboratorRepository.findById(data.collaboratorId)
    }

    async getWorkPackageStatuses(orgId) { 
        const statuses = await this.workPackageStatuses.findAll(orgId)

        return statuses 
    }
    
    async createWorkPackageStatus(data) { return this.workPackageStatuses.create(data) }
    async updateWorkPackageStatus(id, data) { return this.workPackageStatuses.update(id, data) }
    async deleteWorkPackageStatus(id) { return this.workPackageStatuses.delete(id) }

    async provisionDefaultConfiguration(organizationId) {
        const statuses = [
            { name: 'a estimar', color: '#fbbf24', order: 1, organizationId, isClosed: false },
            { name: 'Estimado', color: '#60a5fa', order: 2, organizationId, isClosed: false },
            { name: 'Confirmado', color: '#34d399', order: 3, organizationId, isClosed: false },
            { name: 'por hacer', color: '#e5e7eb', order: 4, organizationId, isClosed: false },
            { name: 'en progreso', color: '#3b82f6', order: 5, organizationId, isClosed: false },
            { name: 'hecho', color: '#22c55e', order: 6, organizationId, isClosed: true },
            { name: 'uat', color: '#a855f7', order: 7, organizationId, isClosed: false },
            { name: 'finalizado', color: '#1f2937', order: 8, organizationId, isClosed: true }
        ];

        await Promise.all(statuses.map(s => this.workPackageStatuses.create(s)));
        
        return true;
    }
}
