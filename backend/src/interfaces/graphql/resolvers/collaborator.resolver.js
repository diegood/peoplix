import { prisma } from '../../../infrastructure/database/client.js'
import { CollaboratorService } from '../../../application/services/CollaboratorService.js'

const service = new CollaboratorService()

export const collaboratorResolver = {
  Query: {
    collaborators: () => service.getAll(),
    collaborator: (_, { id }) => service.getById(id)
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
    updateHolidayCalendar: (_, args) => service.updateHolidayCalendar(args),

    addCollaboratorCareerObjective: (_, { collaboratorId, year, quarter, description, skillId, targetLevel }) => service.addCareerObjective(collaboratorId, year, quarter, description, skillId, targetLevel),
    updateCollaboratorCareerObjective: (_, { id, status }) => service.updateCareerObjective(id, status),
    deleteCollaboratorCareerObjective: (_, { id }) => service.deleteCareerObjective(id),
    
    addCollaboratorMeeting: (_, { collaboratorId, date, notes }) => service.addMeeting(collaboratorId, date, notes),
    updateCollaboratorMeeting: (_, { id, ...data }) => service.updateMeeting(id, data),
    deleteCollaboratorMeeting: (_, { id }) => service.deleteMeeting(id),

    addMeetingActionItem: (_, { meetingId, description }) => service.addMeetingActionItem(meetingId, description),
    updateMeetingActionItem: (_, { id, ...data }) => service.updateMeetingActionItem(id, data),
    deleteMeetingActionItem: (_, { id }) => service.deleteMeetingActionItem(id)
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
      holidayCalendar: async (parent) => {
          if (parent.holidayCalendar !== undefined) return parent.holidayCalendar
          
          // Fetch from DB if not present (undefined)
          const cal = await prisma.holidayCalendar.findFirst({
              where: { collaboratorId: parent.id, year: new Date().getFullYear() } // Or match logic? Usually just by Collab ID if 1:1 or logic needed
          })
          // Wait, schema says 1:1? Or 1:N?
          // Prisma schema not visible but repo implies unique per year?
          // Let's check repository logic.
          // Repo: findUnique where { collaboratorId_year: ... }
          // The Type is just `holidayCalendar: HolidayCalendar` (singular).
          // Assuming the frontend wants *current* calendar or list?
          // Frontend fragment uses `holidayCalendar { ... }`.
          // Let's simply fetch the one that matches or most recent?
          // Actually, let's look at `PrismaCollaboratorRepository.js` findAll include logic: `holidayCalendar: true`.
          // This implies 1:1 relation or 1:N but fetched as list?
          // Type definition says `holidayCalendar: HolidayCalendar`. Singular.
          // So it is 1:1 on Prisma level? Or maybe the relation name is `holidayCalendar`.
          // If 1:1, we can findUnique if we knew ID, or findFirst by collaboratorId.
          
          const collab = await prisma.collaborator.findUnique({
              where: { id: parent.id },
              include: { holidayCalendar: true }
          })
          return collab?.holidayCalendar
      },
      workCenter: async (parent) => {
          if (parent.workCenter !== undefined) return parent.workCenter
          
          const collab = await prisma.collaborator.findUnique({
              where: { id: parent.id },
              include: { 
                  workCenter: {
                      include: {
                          publicHolidayCalendars: true
                      }
                  } 
              }
          })
          return collab?.workCenter
      },
      customFields: (parent) => parent.customFieldValues || [],
      absences: async (parent) => {
          if (parent.absences) return parent.absences
          return prisma.absence.findMany({
              where: { collaboratorId: parent.id },
              include: { type: true }
          })
      },
      skillHistory: (parent) => prisma.collaboratorSkillHistory.findMany({ where: { collaboratorId: parent.id }, orderBy: { createdAt: 'desc' }, include: { skill: true } }),
      careerObjectives: (parent) => prisma.collaboratorCareerObjective.findMany({ where: { collaboratorId: parent.id }, orderBy: [{ year: 'asc' }, { quarter: 'asc' }] }),
      projectSkills: async (parent) => {
          const allocations = await prisma.allocation.findMany({
              where: { collaboratorId: parent.id },
              include: {
                  project: {
                      include: {
                          requiredRoles: {
                              include: {
                                  skills: {
                                      include: { skill: true }
                                  }
                              }
                          }
                      }
                  }
              }
          })
          
          const skillsMap = new Map()
          allocations.forEach(alloc => {
              if (alloc.project && alloc.project.requiredRoles) {
                  alloc.project.requiredRoles.forEach(req => {
                       if (req.skills) {
                           req.skills.forEach(rs => {
                               if (rs.skill && !skillsMap.has(rs.skill.id)) {
                                   skillsMap.set(rs.skill.id, rs.skill)
                               }
                           })
                       }
                  })
              }
          })
          
          return Array.from(skillsMap.values())
      },
      meetings: (parent) => prisma.collaboratorMeeting.findMany({ 
          where: { collaboratorId: parent.id }, 
          orderBy: { date: 'desc' },
          include: { actionItems: true }
      })
  },
  CollaboratorSkillHistory: {
      createdAt: (parent) => parent.createdAt.toISOString()
  },
  CollaboratorCareerObjective: {
      skill: (parent) => {
          if (parent.skill) return parent.skill
          if (parent.skillId) return prisma.skill.findUnique({ where: { id: parent.skillId } })
          return null
      }
  },
  CollaboratorMeeting: {
      date: (parent) => parent.date.toISOString(),
      actionItems: (parent) => {
          if (parent.actionItems) return parent.actionItems
          return prisma.meetingActionItem.findMany({ where: { meetingId: parent.id } })
      }
  }
}
