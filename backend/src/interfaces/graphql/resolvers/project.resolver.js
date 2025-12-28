import { ProjectService } from '../../../application/services/ProjectService.js'
import { WorkPackageService } from '../../../application/services/WorkPackageService.js'

const service = new ProjectService()
const workPackageService = new WorkPackageService()

export const projectResolver = {
  Query: {
    projects: (_, args) => service.getAll(args),
    project: (_, { id }) => service.getById(id)
  },
  Mutation: {
    createProject: (_, { name, contractedHours, startDate }) => service.create({ name, contractedHours, startDate }),
    updateProject: (_, { id, name, contractedHours, startDate }) => service.update(id, { name, contractedHours, startDate }),
    deleteProject: async (_, { id }) => {
        await service.delete(id)
        return true
    },
    addProjectRequirement: (_, args) => service.addRequirement(args),
    updateProjectRequirement: (_, args) => service.updateRequirement(args.requirementId, args),
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
  },
  Project: {
      workPackages: (parent, { status }) => workPackageService.getByProject(parent.id, status)
  }
}
