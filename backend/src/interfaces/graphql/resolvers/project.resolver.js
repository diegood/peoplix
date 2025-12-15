import { ProjectService } from '../../../application/services/ProjectService.js'

const service = new ProjectService()

export const projectResolver = {
  Query: {
    projects: (_, args) => service.getAll(args),
    project: (_, { id }) => service.getById(id)
  },
  Mutation: {
    createProject: (_, { name, contractedHours }) => service.create({ name, contractedHours }),
    updateProject: (_, { id, name, contractedHours }) => service.update(id, { name, contractedHours }),
    deleteProject: async (_, { id }) => {
        await service.delete(id)
        return true
    },
    addProjectRequirement: (_, args) => service.addRequirement(args),
    removeProjectRequirement: (_, { projectId, requirementId }) => service.removeRequirement(requirementId),
    addRequirementSkill: (_, { requirementId, skillName, level }) => service.addRequirementSkill(requirementId, skillName, level),
    removeRequirementSkill: (_, { requirementId, skillId }) => service.removeRequirementSkill(requirementId, skillId),
    createMilestone: (_, args) => service.createMilestone(args),
    deleteMilestone: async (_, { id }) => {
        await service.deleteMilestone(id)
        return true
    }
  },
  ProjectRequirement: {
    skills: (parent) => {
        if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
             return parent.skills.map(rs => ({ 
                 id: rs.id,
                 skill: rs.skill,
                 name: rs.skill.name,
                 level: rs.level 
             }))
        }
        return parent.skills || []
    }
  },
  ProjectRequirementSkill: {
      name: (parent) => parent.name || parent.skill?.name
  }
}
