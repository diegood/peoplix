import { prisma } from '../../../infrastructure/database/client.js'
import { CollaboratorService } from '../../../application/services/CollaboratorService.js'

const service = new CollaboratorService()
const ADMIN_ROLE = 1

export const collaboratorResolver = {
  Query: {
    collaborators: (_, { search, organizationId }, context) => {
        let targetOrgId = context.user.organizationId;
        
        if (context.user.isSuperAdmin) {
            if (organizationId === null) {
                targetOrgId = null;
            } else if (organizationId) {
                targetOrgId = organizationId;
            }
        }
        
        return service.getAll(targetOrgId, search) 
    },
    collaborator: (_, { id }, context) => {
        return service.getById(id)
    },
    searchGlobalUsers: async (_, { search }, context) => {
        if (!search || search.length < 3) return [];
        
        const results = await prisma.collaborator.findMany({
            where: {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            },
            include: { user: true },
            take: 20
        });

        const unique = [];
        const emails = new Set();
        for (const r of results) {
            const email = r.user?.email;
            if (email && !emails.has(email)) {
                emails.add(email);
                unique.push(r);
            }
        }
        return unique;
    }
  },
  Mutation: {
    createCollaborator: (_, args, context) => {
        const { organizationId, ...rest } = args;
        
        let targetOrgId = context.user.organizationId;

        if (context.user.isSuperAdmin && organizationId) {
            targetOrgId = organizationId;
        }

        return service.create({ ...rest, organizationId: targetOrgId }); 
    },
    updateCollaborator: (_, { id, ...data }, context) => {
        if (data.systemRole !== undefined) {
             if (!context.user || context.user.role > ADMIN_ROLE) { 
                 throw new Error('Unauthorized: You cannot change system roles');
             }
             if (!context.user.isSuperAdmin) {
                 if (data.systemRole === 0) throw new Error('Unauthorized: Org Admins cannot promote to Super Admin');
             }
        }
        return service.update(id, data);
    },
    deleteCollaborator: async (_, { id }, context) => {
        await service.delete(id)
        return true
    },
    addCollaboratorSkill: (_, { collaboratorId, skillId, level }, context) => {
        return service.addSkill(collaboratorId, skillId, level);
    },
    removeCollaboratorSkill: (_, { collaboratorId, skillId }, context) => {
         return service.removeSkill(collaboratorId, skillId);
    },
    
    addHardware: (_, args, context) => {
        return service.addHardware(args);
    },
    removeHardware: (_, { id }, context) => {
        return service.removeHardware(id);
    },
    updateHolidayCalendar: (_, args, context) => {
        return service.updateHolidayCalendar(args);
    },

    addCollaboratorCareerObjective: (_, { collaboratorId, year, quarter, description, skillId, targetLevel }, context) => {
        return service.addCareerObjective(collaboratorId, year, quarter, description, skillId, targetLevel)
    },
    updateCollaboratorCareerObjective: (_, { id, status }, context) => {
        return service.updateCareerObjective(id, status);
    },
    deleteCollaboratorCareerObjective: (_, { id }, context) => {
        return service.deleteCareerObjective(id);
    },
    
    addCollaboratorMeeting: (_, { collaboratorId, date, notes }, context) => {
        return service.addMeeting(collaboratorId, date, notes);
    },
    updateCollaboratorMeeting: (_, { id, ...data }, context) => {
        return service.updateMeeting(id, data);
    },
    deleteCollaboratorMeeting: (_, { id }, context) => {
        return service.deleteMeeting(id);
    },

    addMeetingActionItem: (_, { meetingId, description }, context) => {
        return service.addMeetingActionItem(meetingId, description);
    },
    updateMeetingActionItem: (_, { id, ...data }, context) => {
        return service.updateMeetingActionItem(id, data);
    },
    deleteMeetingActionItem: (_, { id }, context) => {
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
