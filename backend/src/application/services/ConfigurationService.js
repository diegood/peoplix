import { 
    PrismaRoleRepository, 
    PrismaSkillRepository, 
    PrismaTechnologyRepository, 
    PrismaMilestoneTypeRepository,
    PrismaHierarchyTypeRepository,
    PrismaCustomFieldRepository 
} from '../../infrastructure/repositories/PrismaConfigurationRepositories.js'

export class ConfigurationService {
    constructor() {
        this.roles = new PrismaRoleRepository()
        this.skills = new PrismaSkillRepository()
        this.technologies = new PrismaTechnologyRepository()
        this.milestoneTypes = new PrismaMilestoneTypeRepository()
        this.hierarchyTypes = new PrismaHierarchyTypeRepository()
        this.customFields = new PrismaCustomFieldRepository()
    }
    
    // Roles
    async getRoles() { return this.roles.findAll() }
    async createRole(name) { return this.roles.create({ name }) }
    async deleteRole(id) { return this.roles.delete(id) }

    // Skills
    async getSkills() { return this.skills.findAll() }
    async createSkill(name) { return this.skills.create({ name }) }
    async deleteSkill(id) { return this.skills.delete(id) }

    // Technologies
    async getTechnologies() { return this.technologies.findAll() }
    async createTechnology(name) { return this.technologies.create({ name }) }
    async deleteTechnology(id) { return this.technologies.delete(id) }

    // Milestone Types
    async getMilestoneTypes() { return this.milestoneTypes.findAll() }
    async createMilestoneType(data) { return this.milestoneTypes.create(data) }
    async updateMilestoneType(id, data) { return this.milestoneTypes.update(id, data) }
    async deleteMilestoneType(id) { return this.milestoneTypes.delete(id) }
    
    // Hierarchy Types
    async getHierarchyTypes() { return this.hierarchyTypes.findAll() }
    async createHierarchyType(data) { return this.hierarchyTypes.create(data) }
    async updateHierarchyType(id, data) { return this.hierarchyTypes.update(id, data) }
    async deleteHierarchyType(id) { return this.hierarchyTypes.delete(id) }

    // Custom Fields
    async getCustomFieldDefinitions() { return this.customFields.findAll() }
    async createCustomFieldDefinition(data) { return this.customFields.create(data) }
    async updateCustomFieldDefinition(id, data) { return this.customFields.update(id, data) }
    async deleteCustomFieldDefinition(id) { return this.customFields.delete(id) }
    async setCustomFieldValue(data) { return this.customFields.setValue(data) }
}
