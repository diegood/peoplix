import { ConfigurationService } from '../../../application/services/ConfigurationService.js'

const service = new ConfigurationService()

export const configurationResolver = {
  Query: {
    roles: (_, __, { user }) => service.getRoles(user.organizationId),
    skills: (_, __, { user }) => service.getSkills(user.organizationId),
    technologies: (_, __, { user }) => service.getTechnologies(user.organizationId),
    milestoneTypes: (_, __, { user }) => service.getMilestoneTypes(user.organizationId),
    hierarchyTypes: (_, __, { user }) => service.getHierarchyTypes(user.organizationId),
    customFieldDefinitions: (_, __, { user }) => service.getCustomFieldDefinitions(user.organizationId)
  },
  Mutation: {
    createRole: (_, { name }, { user }) => service.createRole(name, user.organizationId),
    deleteRole: (_, { id }) => service.deleteRole(id),
    createSkill: (_, { name }, { user }) => service.createSkill(name, user.organizationId),
    deleteSkill: (_, { id }) => service.deleteSkill(id),
    createTechnology: (_, { name }, { user }) => service.createTechnology(name, user.organizationId),
    deleteTechnology: (_, { id }) => service.deleteTechnology(id),
    
    createMilestoneType: (_, args, { user }) => service.createMilestoneType({ ...args, organizationId: user.organizationId }),
    updateMilestoneType: (_, { id, ...data }) => service.updateMilestoneType(id, data),
    deleteMilestoneType: (_, { id }) => service.deleteMilestoneType(id),
    
    createHierarchyType: (_, args, { user }) => service.createHierarchyType({ ...args, organizationId: user.organizationId }),
    updateHierarchyType: (_, { id, ...data }) => service.updateHierarchyType(id, data),
    deleteHierarchyType: (_, { id }) => service.deleteHierarchyType(id),
    
    createCustomFieldDefinition: (_, args, { user }) => service.createCustomFieldDefinition({ ...args, organizationId: user.organizationId }),
    updateCustomFieldDefinition: (_, { id, ...data }) => service.updateCustomFieldDefinition(id, data),
    deleteCustomFieldDefinition: (_, { id }) => service.deleteCustomFieldDefinition(id),
    setCustomFieldValue: (_, args) => service.setCustomFieldValue(args)
  }
}
