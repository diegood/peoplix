import { 
    PrismaRoleRepository, 
    PrismaSkillRepository, 
    PrismaTechnologyRepository, 
    PrismaMilestoneTypeRepository,
    PrismaHierarchyTypeRepository,
    PrismaCustomFieldRepository 
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
        this.collaboratorRepository = repositories.collaboratorRepository || new PrismaCollaboratorRepository()
    }
    
    // Roles
    async getRoles(orgId) { return this.roles.findAll(orgId) }
    async createRole(name, orgId) { return this.roles.create({ name, organizationId: orgId }) }
    async deleteRole(id) { return this.roles.delete(id) }

    // Skills
    async getSkills(orgId) { return this.skills.findAll(orgId) }
    async createSkill(name, orgId) { return this.skills.create({ name, organizationId: orgId }) }
    async deleteSkill(id) { return this.skills.delete(id) }

    // Technologies
    async getTechnologies(orgId) { return this.technologies.findAll(orgId) }
    async createTechnology(name, orgId) { return this.technologies.create({ name, organizationId: orgId }) }
    async deleteTechnology(id) { return this.technologies.delete(id) }

    // Milestone Types
    async getMilestoneTypes(orgId) { return this.milestoneTypes.findAll(orgId) }
    async createMilestoneType(data) { return this.milestoneTypes.create(data) } // data includes orgId
    async updateMilestoneType(id, data) { return this.milestoneTypes.update(id, data) }
    async deleteMilestoneType(id) { return this.milestoneTypes.delete(id) }
    
    // Hierarchy Types
    async getHierarchyTypes(orgId) { return this.hierarchyTypes.findAll(orgId) }
    async createHierarchyType(data) { return this.hierarchyTypes.create(data) } // data includes orgId
    async updateHierarchyType(id, data) { return this.hierarchyTypes.update(id, data) }
    async deleteHierarchyType(id) { return this.hierarchyTypes.delete(id) }

    // Custom Fields
    async getCustomFieldDefinitions(orgId) { return this.customFields.findAll(orgId) }
    async createCustomFieldDefinition(data) { return this.customFields.create(data) } // data includes orgId
    async updateCustomFieldDefinition(id, data) { return this.customFields.update(id, data) }
    async deleteCustomFieldDefinition(id) { return this.customFields.delete(id) }
    async setCustomFieldValue(data) { 
        await this.customFields.setValue(data)
        return this.collaboratorRepository.findById(data.collaboratorId)
    }
}
