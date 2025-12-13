import { ProjectService } from '../../application/services/ProjectService.js';
import { CollaboratorService } from '../../application/services/CollaboratorService.js';
import { AllocationService } from '../../application/services/AllocationService.js';
import { prisma } from '../../infrastructure/database/prisma.js'; // For aux models

const projectService = new ProjectService();
const collaboratorService = new CollaboratorService();
const allocationService = new AllocationService();

export const resolvers = {
  Query: {
    roles: () => prisma.role.findMany(),
    technologies: () => prisma.technology.findMany(),
    milestoneTypes: () => prisma.milestoneType.findMany({ orderBy: { name: 'asc' } }),
    hierarchyTypes: () => prisma.hierarchyType.findMany({ orderBy: { rank: 'asc' } }),
    
    projects: () => projectService.getAll(),
    project: (_, { id }) => projectService.getById(id),
    
    collaborators: () => collaboratorService.getAll()
  },
  
  Mutation: {
    createRole: (_, { name }) => prisma.role.create({ data: { name } }),
    deleteRole: async (_, { id }) => {
       await prisma.role.delete({ where: { id } })
       return id
    },
    createTechnology: (_, { name }) => prisma.technology.create({ data: { name } }),
    deleteTechnology: async (_, { id }) => {
        await prisma.technology.delete({ where: { id } })
        return id
    },

    createMilestoneType: async (_, { name, color }) => {
      return await prisma.milestoneType.create({ data: { name, color }})
    },
    updateMilestoneType: async (_, { id, name, color }) => {
      return await prisma.milestoneType.update({
        where: { id },
        data: { name, color }
      })
    },
    deleteMilestoneType: async (_, { id }) => {
       const used = await prisma.milestone.count({ where: { milestoneTypeId: id }})
       if (used > 0) throw new Error("No se puede eliminar un tipo de hito que está en uso.")
       await prisma.milestoneType.delete({ where: { id }})
       return true
    },
    
    createHierarchyType: (_, { name, color, rank }) => prisma.hierarchyType.create({ data: { name, color, rank } }),
    updateHierarchyType: (_, { id, name, color, rank }) => prisma.hierarchyType.update({ where: { id }, data: { name, color, rank } }),
    deleteHierarchyType: async (_, { id }) => {
        const used = await prisma.allocationHierarchy.count({ where: { hierarchyTypeId: id } })
        if (used > 0) throw new Error("No se puede eliminar un tipo de jerarquía en uso.")
        await prisma.hierarchyType.delete({ where: { id } })
        return true
    },
    
    createProject: (_, { name, contractedHours }) => projectService.create({ name, contractedHours }),
    
    createCollaborator: (_, { name, contractedHours }) => collaboratorService.create({ name, contractedHours }),
    
    createAllocation: (_, args) => allocationService.create(args),
    updateAllocation: (_, { allocationId, percentage, endWeek }) => allocationService.update(allocationId, { percentage, endWeek }),
    deleteAllocation: (_, { allocationId }) => allocationService.delete(allocationId),
    addAllocationRole: (_, { allocationId, roleId }) => allocationService.addRole(allocationId, roleId),
    removeAllocationRole: (_, { allocationId, roleId }) => allocationService.removeRole(allocationId, roleId),
    
    addAllocationHierarchy: async (_, { subordinateAllocId, supervisorAllocId, typeId }) => {
        return prisma.allocationHierarchy.upsert({
            where: {
                subordinateId_hierarchyTypeId: {
                    subordinateId: subordinateAllocId,
                    hierarchyTypeId: typeId
                }
            },
            update: {
                supervisorId: supervisorAllocId
            },
            create: {
                subordinateId: subordinateAllocId,
                supervisorId: supervisorAllocId,
                hierarchyTypeId: typeId
            },
            include: { subordinate: true, supervisor: true, hierarchyType: true }
        })
    },
    removeAllocationHierarchy: async (_, { hierarchyId }) => {
        await prisma.allocationHierarchy.delete({ where: { id: hierarchyId } })
        return true
    },
    
  },
  
  ProjectRequirement: {
    skills: async (parent) => {
        if (parent.skills) {
            if (parent.skills.length > 0 && parent.skills[0].skill !== undefined) {
                 return parent.skills
                    .filter(rs => rs.skill) 
                    .map(rs => ({ ...rs.skill, level: rs.level }));
            }
        }
        return [] 
    }
  },

  Allocation: {
      supervisors: async (parent) => {
          return prisma.allocationHierarchy.findMany({
              where: { subordinateId: parent.id },
              include: { 
                  supervisor: { include: { collaborator: true } }, 
                  subordinate: { include: { collaborator: true } },
                  hierarchyType: true
              }
          })
      },
      subordinates: async (parent) => {
          return prisma.allocationHierarchy.findMany({
              where: { supervisorId: parent.id },
              include: { 
                  supervisor: { include: { collaborator: true } }, 
                  subordinate: { include: { collaborator: true } },
                  hierarchyType: true
              }
          })
      }
  },
  
  AllocationHierarchy: {
      subordinate: (parent) => parent.subordinate || prisma.allocation.findUnique({ where: { id: parent.subordinateId }}),
      supervisor: (parent) => parent.supervisor || prisma.allocation.findUnique({ where: { id: parent.supervisorId }}),
      hierarchyType: (parent) => parent.hierarchyType || prisma.hierarchyType.findUnique({ where: { id: parent.hierarchyTypeId } })
  }
}
