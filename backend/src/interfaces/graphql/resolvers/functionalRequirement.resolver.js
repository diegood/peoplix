import FunctionalRequirementService from '../../../../application/services/FunctionalRequirementService.js';

export default {
  Query: {
    functionalRequirements: async (_, { projectId, status }) => {
      return FunctionalRequirementService.list(projectId, { status });
    },
    functionalRequirement: async (_, { id }) => {
      return FunctionalRequirementService.getById(id);
    }
  },
  Mutation: {
    createFunctionalRequirement: async (_, args, { user }) => {
      const userId = user?.id || null; 
      return FunctionalRequirementService.create(args, userId);
    },
    updateFunctionalRequirement: async (_, { id, ...data }, { user }) => {
      const userId = user?.id || null;
      return FunctionalRequirementService.update(id, data, userId);
    },
    deleteFunctionalRequirement: async (_, { id }) => {
      return FunctionalRequirementService.delete(id);
    }
  }
};
