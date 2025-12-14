import { CollaboratorService } from '../../../application/services/CollaboratorService.js'

const service = new CollaboratorService()

export const collaboratorResolver = {
  Query: {
    collaborators: () => service.getAll()
  },
  Mutation: {
    createCollaborator: (_, args) => service.create(args),
    updateCollaborator: (_, { id, ...data }) => service.update(id, data),
    deleteCollaborator: async (_, { id }) => {
        await service.delete(id)
        return true
    },
    addCollaboratorSkill: (_, { collaboratorId, skillId, level }) => service.addSkill(collaboratorId, skillId, level),
    removeCollaboratorSkill: (_, { collaboratorId, skillId }) => service.removeSkill(collaboratorId, skillId),
    
    addHardware: (_, args) => service.addHardware(args),
    removeHardware: (_, { id }) => service.removeHardware(id),
    updateHolidayCalendar: (_, args) => service.updateHolidayCalendar(args)
  },
  HolidayCalendar: {
      holidays: (parent) => {
          try {
              return typeof parent.holidays === 'string' ? JSON.parse(parent.holidays) : parent.holidays
          } catch {
              return []
          }
      },
      lastModified: (parent) => parent.lastModified?.toISOString()
  },
  Collaborator: {
      joinDate: (parent) => parent.joinDate?.toISOString(),
      skills: (parent) => {
          if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
               return parent.skills
          }
          return parent.skills || []
      },
      roles: (parent) => {
          if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(cr => cr.role)
          } 
          return parent.roles ? parent.roles.map(r => r.role) : []
      },
      isActive: (parent) => parent.isActive ?? true,
      hardware: (parent) => parent.hardware || [],
      holidayCalendar: (parent) => parent.holidayCalendar,
      customFields: (parent) => parent.customFieldValues || []
  }
}
