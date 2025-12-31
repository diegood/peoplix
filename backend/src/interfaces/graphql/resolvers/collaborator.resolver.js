import { prisma } from '../../../infrastructure/database/client.js'
import { CollaboratorService } from '../../../application/services/CollaboratorService.js'

const service = new CollaboratorService()
const ADMIN_ROLE = 1

const checkAdmin = (context) => {
    if (!context.user || context.user.role !== ADMIN_ROLE) { 
        throw new Error('Unauthorized: Admin access required')
    }
}

const checkOwnerOrAdmin = (context, resourceId) => {
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.role === ADMIN_ROLE) return;
    if (context.user.userId === resourceId) return;
    throw new Error('Unauthorized: You can only edit your own profile');
}

export const collaboratorResolver = {
  Query: {
    collaborators: (_, __, context) => {
        if (!context.user) throw new Error('Unauthorized'); 
        return service.getAll(context.user.organizationId) 
    },
    collaborator: (_, { id }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        return service.getById(id)
    }
  },
  Mutation: {
    createCollaborator: (_, args, context) => {
        checkAdmin(context);
        return service.create({ ...args, organizationId: context.user.organizationId }); 
    },
    updateCollaborator: (_, { id, ...data }, context) => {
        checkOwnerOrAdmin(context, id);
        return service.update(id, data);
    },
    deleteCollaborator: async (_, { id }, context) => {
        checkAdmin(context);
        await service.delete(id)
        return true
    },
    addCollaboratorSkill: (_, { collaboratorId, skillId, level }, context) => {
        checkOwnerOrAdmin(context, collaboratorId);
        return service.addSkill(collaboratorId, skillId, level);
    },
    removeCollaboratorSkill: (_, { collaboratorId, skillId }, context) => {
         checkOwnerOrAdmin(context, collaboratorId);
         return service.removeSkill(collaboratorId, skillId);
    },
    
    addHardware: (_, args, context) => {
        checkOwnerOrAdmin(context, args.collaboratorId);
        return service.addHardware(args);
    },
    removeHardware: (_, { id }, context) => {
        checkAdmin(context); 
        return service.removeHardware(id);
    },
    updateHolidayCalendar: (_, args, context) => {
        checkAdmin(context); 
        return service.updateHolidayCalendar(args);
    },

    addCollaboratorCareerObjective: (_, { collaboratorId, year, quarter, description, skillId, targetLevel }, context) => {
        checkOwnerOrAdmin(context, collaboratorId);
        return service.addCareerObjective(collaboratorId, year, quarter, description, skillId, targetLevel)
    },
    updateCollaboratorCareerObjective: (_, { id, status }, context) => {
        checkAdmin(context);
        return service.updateCareerObjective(id, status);
    },
    deleteCollaboratorCareerObjective: (_, { id }, context) => {
        checkAdmin(context);
        return service.deleteCareerObjective(id);
    },
    
    addCollaboratorMeeting: (_, { collaboratorId, date, notes }, context) => {
        checkAdmin(context);
        return service.addMeeting(collaboratorId, date, notes);
    },
    updateCollaboratorMeeting: (_, { id, ...data }, context) => {
        checkAdmin(context);
        return service.updateMeeting(id, data);
    },
    deleteCollaboratorMeeting: (_, { id }, context) => {
        checkAdmin(context);
        return service.deleteMeeting(id);
    },

    addMeetingActionItem: (_, { meetingId, description }, context) => {
        checkAdmin(context);
        return service.addMeetingActionItem(meetingId, description);
    },
    updateMeetingActionItem: (_, { id, ...data }, context) => {
        checkAdmin(context);
        return service.updateMeetingActionItem(id, data);
    },
    deleteMeetingActionItem: (_, { id }, context) => {
        checkAdmin(context);
        return service.deleteMeetingActionItem(id)
    }
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
      allocations: (parent) => {
          if (parent.allocations) return parent.allocations
          return prisma.allocation.findMany({
              where: { collaboratorId: parent.id },
              include: { 
                  project: { 
                      include: { organization: true } 
                  }
              }
          })
      },
      email: async (parent) => {
          if (parent.user && parent.user.email) return parent.user.email;
          const user = await prisma.user.findUnique({ where: { id: parent.userId } });
          return user ? user.email : null;
      },
      hardware: (parent) => parent.hardware || [],
      holidayCalendar: async (parent) => {
          if (parent.holidayCalendar !== undefined) return parent.holidayCalendar
          
          const cal = await prisma.holidayCalendar.findFirst({
              where: { collaboratorId: parent.id, year: new Date().getFullYear() }
          })
          
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
      }),
      organization: (parent) => {
          if (parent.organization) return parent.organization
          if (parent.organizationId) return prisma.organization.findUnique({ where: { id: parent.organizationId } })
          return null
      }
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
