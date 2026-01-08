import FunctionalRequirementService from '../../../application/services/FunctionalRequirementService.js';
import { prisma } from '../../../infrastructure/database/client.js';

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
      const userId = user?.userId || null; 
      return FunctionalRequirementService.create(args, userId);
    },
    updateFunctionalRequirement: async (_, { id, ...data }, { user }) => {
      const userId = user?.userId || null;
      return FunctionalRequirementService.update(id, data, userId);
    },
    deleteFunctionalRequirement: async (_, { id }) => {
      return FunctionalRequirementService.delete(id);
    },
    addFunctionalRequirementRelation: async (_, { fromId, toId, type = 'related' }) => {
      return prisma.functionalRequirementRelation.create({
        data: {
          fromId,
          toId,
          type
        },
        include: {
          from: true,
          to: true
        }
      });
    },
    removeFunctionalRequirementRelation: async (_, { fromId, toId }) => {
      await prisma.functionalRequirementRelation.delete({
        where: {
          fromId_toId: {
            fromId,
            toId
          }
        }
      });
      return true;
    }
  },
  FunctionalRequirement: {
    relatedTo: async (requirement) => {
      const relations = await prisma.functionalRequirementRelation.findMany({
        where: { fromId: requirement.id },
        include: { to: true }
      });
      return relations.map(r => r.to);
    },
    relatedFrom: async (requirement) => {
      const relations = await prisma.functionalRequirementRelation.findMany({
        where: { toId: requirement.id },
        include: { from: true }
      });
      return relations.map(r => r.from);
    }
  }
};
