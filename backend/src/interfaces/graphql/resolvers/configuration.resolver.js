import { ConfigurationService } from '../../../application/services/ConfigurationService.js'

const service = new ConfigurationService()

export const configurationResolver = {
  Query: {
    roles: () => service.getRoles(),
    skills: () => service.getSkills(),
    technologies: () => service.getTechnologies(),
    milestoneTypes: () => service.getMilestoneTypes(),
    hierarchyTypes: () => service.getHierarchyTypes(),
    customFieldDefinitions: () => service.getCustomFieldDefinitions()
  },
  Mutation: {
    createRole: (_, { name }) => service.createRole(name),
    deleteRole: (_, { id }) => service.deleteRole(id),
    createSkill: (_, { name }) => service.createSkill(name),
    deleteSkill: (_, { id }) => service.deleteSkill(id),
    createTechnology: (_, { name }) => service.createTechnology(name),
    deleteTechnology: (_, { id }) => service.deleteTechnology(id),
    
    createMilestoneType: (_, args) => service.createMilestoneType(args),
    updateMilestoneType: (_, { id, ...data }) => service.updateMilestoneType(id, data),
    deleteMilestoneType: (_, { id }) => service.deleteMilestoneType(id),
    
    createHierarchyType: (_, args) => service.createHierarchyType(args),
    updateHierarchyType: (_, { id, ...data }) => service.updateHierarchyType(id, data),
    deleteHierarchyType: (_, { id }) => service.deleteHierarchyType(id),
    
    createCustomFieldDefinition: (_, args) => service.createCustomFieldDefinition(args),
    updateCustomFieldDefinition: (_, { id, ...data }) => service.updateCustomFieldDefinition(id, data),
    deleteCustomFieldDefinition: (_, { id }) => service.deleteCustomFieldDefinition(id),
    setCustomFieldValue: (_, args) => service.setCustomFieldValue(args)
  }
}
