import 'dotenv/config'
import pkg from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

// Debug available models
console.log('Prisma Models:', Object.keys(prisma)) // Should show project, technology, etc.
if (!prisma.technology) console.error('CRITICAL: prisma.technology is missing!')

export const resolvers = {
  Query: {
    roles: () => prisma.role.findMany(),
    projects: () => prisma.project.findMany({
      include: {
        allocations: {
          include: {
            collaborator: { include: { skills: { include: { skill: true } } } },
            roles: { include: { role: true } }
          }
        },
        milestones: { include: { milestoneType: true } },
        sprints: true,
        requiredRoles: {
          include: {
            role: true,
            skills: { include: { skill: true } }
          }
        }
      }
    }),
    collaborators: () => prisma.collaborator.findMany({
      include: {
        skills: { include: { skill: true } },
        allocations: { include: { project: true } },
        roles: { include: { role: true } },
        hardware: true,
        holidayCalendar: true,
        customFieldValues: { include: { fieldDefinition: true } }
      }
    }),
    customFieldDefinitions: () => prisma.customFieldDefinition.findMany({ orderBy: { order: 'asc' } }),
    workCenters: () => prisma.workCenter.findMany(),
    project: (_, { id }) => prisma.project.findUnique({
      where: { id },
      include: {
        allocations: {
             roles: { include: { role: true } } 
           }
        },
        milestones: { include: { milestoneType: true } },
        requiredRoles: { include: { role: true, skills: { include: { skill: true } } } }
      }
    }),
    technologies: () => prisma.technology.findMany(),
    skills: () => prisma.skill.findMany(),
    milestoneTypes: () => prisma.milestoneType.findMany({ orderBy: { name: 'asc' }}),
    workCenters: () => prisma.workCenter.findMany({
      include: {
        publicHolidayCalendars: true
      }
    })
  },
  
  
  Mutation: {
    createTechnology: async (_, { name }) => {
      return await prisma.technology.create({ data: { name } })
    },
    deleteTechnology: async (_, { id }) => {
      await prisma.technology.delete({ where: { id } })
      return true
    },
    createRole: async (_, { name }) => {
      return await prisma.role.create({ data: { name } })
    },
    deleteRole: async (_, { id }) => {
      await prisma.role.delete({ where: { id } })
      return true
    },
    createSkill: async (_, { name }) => {
      return await prisma.skill.create({ data: { name } })
    },
    deleteSkill: async (_, { id }) => {
      await prisma.skill.delete({ where: { id } })
      return true
    },
    
    createMilestoneType: async (_, args) => {
        return await prisma.milestoneType.create({ data: args })
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
    
    createProject: (_, { name, contractedHours }) => prisma.project.create({
      data: { name, contractedHours }
    }),
    
    createCollaborator: async (_, { userName, firstName, lastName, contractedHours, joinDate, workCenterId }) => {
      return await prisma.collaborator.create({
        data: {
          userName,
          firstName,
          lastName,
          contractedHours,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          workCenterId
        },
        include: {
          skills: { include: { skill: true } },
          hardware: true,
          holidayCalendar: true,
          customFieldValues: { include: { fieldDefinition: true } }
        }
      })
    },
    
    updateCollaborator: async (_, { id, userName, firstName, lastName, contractedHours, joinDate, isActive, workCenterId }) => {
       const data = {
        userName, firstName, lastName, contractedHours, isActive
       }
       if (joinDate) data.joinDate = new Date(joinDate)
       if (workCenterId) data.workCenterId = workCenterId
       
       return await prisma.collaborator.update({
        where: { id },
        data
      })
    },
    deleteCollaborator: async (_, { id }) => {
        await prisma.collaborator.delete({ where: { id } })
        return true
    },
    
    // Hardware Management
    addHardware: async (_, { collaboratorId, name, type, serialNumber }) => {
      return await prisma.hardware.create({
        data: {
          collaboratorId,
          name,
          type,
          serialNumber
        }
      })
    },
    
    removeHardware: async (_, { id }) => {
      await prisma.hardware.delete({ where: { id } })
      return true
    },
    
    // Holiday Calendar Management
    updateHolidayCalendar: async (_, { collaboratorId, year, holidays }) => {
      // Check if calendar exists for this year
      const existing = await prisma.holidayCalendar.findUnique({
        where: {
          collaboratorId_year: { collaboratorId, year }
        }
      })

      if (existing) {
         // Check restriction: Can only edit if lastModified is not in current year? 
         // Or strict "once per year" rule. Let's implement a simpler rule for now:
         // If it's a different calendar year than current real time, warn? 
         // For now, let's just allow update but we can add business logic here.
         return await prisma.holidayCalendar.update({
           where: { id: existing.id },
           data: {
             holidays: JSON.stringify(holidays)
           }
         })
      } else {
        return await prisma.holidayCalendar.create({
          data: {
            collaboratorId,
            year,
            holidays: JSON.stringify(holidays)
          }
        })
      }
    },
    
    // Custom Field Definitions
    createCustomFieldDefinition: async (_, args) => {
        return await prisma.customFieldDefinition.create({ data: args })
    },
    
    updateCustomFieldDefinition: async (_, { id, ...data }) => {
        return await prisma.customFieldDefinition.update({ where: { id }, data })
    },
    
    deleteCustomFieldDefinition: async (_, { id }) => {
      await prisma.customFieldDefinition.delete({ where: { id } })
      return true
    },
    
    // Custom Field Values
    setCustomFieldValue: async (_, { collaboratorId, fieldDefinitionId, value }) => {
      return await prisma.customFieldValue.upsert({
        where: {
          collaboratorId_fieldDefinitionId: { collaboratorId, fieldDefinitionId }
        },
        update: { value },
        create: {
          collaboratorId,
          fieldDefinitionId,
          value
        },
        include: {
          fieldDefinition: true
        }
      })
    },
    
    addCollaboratorSkill: async (_, { collaboratorId, skillId, level }) => {
        // Upsert relation
        await prisma.collaboratorSkill.upsert({
            where: {
                collaboratorId_skillId: {
                    collaboratorId,
                    skillId
                }
            },
            update: { level },
            create: {
                collaboratorId,
                skillId,
                level
            },
            include: { skill: true }
        })
        
        // Return collaborator to match Schema return type "Collaborator!"
        return await prisma.collaborator.findUnique({
             where: { id: collaboratorId },
             include: {
                skills: { include: { skill: true } },
                allocations: true,
                roles: { include: { role: true } },
                hardware: true,
                holidayCalendar: true,
                customFieldValues: { include: { fieldDefinition: true } }
             }
        })
    },
    
    removeCollaboratorSkill: async (_, { collaboratorId, skillId }) => {
         await prisma.collaboratorSkill.delete({
             where: {
                 collaboratorId_skillId: {
                     collaboratorId,
                     skillId
                 }
             }
         })
         return true
    },
    
    // Allocations
    createAllocation: async (_, { projectId, collaboratorId, roleId, percentage, startWeek }) => {
        // Create Allocation
        const allocation = await prisma.allocation.create({
            data: {
                projectId,
                collaboratorId,
                dedicationPercentage: percentage,
                startWeek,
                endWeek: null,
                roles: {
                    create: {
                        roleId: roleId
                    }
                }
            },
            include: {
                roles: { include: { role: true } },
                collaborator: true,
                project: true
            }
        })
        return {
            ...allocation,
            hours: (allocation.dedicationPercentage / 100) * 160,
            roles: allocation.roles.map(ar => ar.role)
        }
    },
    
    updateAllocation: async (_, { allocationId, percentage, endWeek }) => {
        const data = {}
        if (percentage !== undefined) data.dedicationPercentage = percentage
        if (endWeek !== undefined) data.endWeek = endWeek
        
        const updated = await prisma.allocation.update({
            where: { id: allocationId },
            data,
            include: { roles: { include: { role: true } } }
        })
        return {
             ...updated,
             hours: (updated.dedicationPercentage / 100) * 160,
             roles: updated.roles.map(ar => ar.role)
        }
    },
    
    deleteAllocation: async (_, { allocationId }) => {
        await prisma.allocation.delete({ where: { id: allocationId } })
        return allocationId
    },
    
    addAllocationRole: async (_, { allocationId, roleId }) => {
        await prisma.allocationRole.create({
            data: { allocationId, roleId }
        })
        const role = await prisma.role.findUnique({ where: { id: roleId } })
        return role
    },
    
    removeAllocationRole: async (_, { allocationId, roleId }) => {
        // Needs to find the ID of AllocationRole entry
        // Usually schema requires specific ID, but here we query by unique compound
        // Prisma allows deleting by compound ID if defined in schema?
        // Yes @@unique([allocationId, roleId])
        await prisma.allocationRole.delete({
            where: {
                allocationId_roleId: {
                    allocationId,
                    roleId
                }
            }
        })
        return roleId
    },
    
    // Milestones
    createMilestone: async (_, { projectId, name, date, type, milestoneTypeId }) => {
      let finalTypeId = milestoneTypeId
      
      // If type name provided but no ID, try to find or create
      if (!finalTypeId && type) {
          const formattedName = type // Keep casing?
          const existing = await prisma.milestoneType.findUnique({ where: { name: formattedName }})
          if (existing) {
              finalTypeId = existing.id
          } else {
              // Create default
              const created = await prisma.milestoneType.create({
                  data: { 
                      name: formattedName,
                      color: 'bg-purple-400'
                  }
              })
              finalTypeId = created.id
          }
      }

      return await prisma.milestone.create({
        data: {
          projectId,
          name,
          date,
          type, 
          milestoneTypeId: finalTypeId
        },
        include: { milestoneType: true }
      })
    },
    
    deleteMilestone: async (_, { id }) => {
        await prisma.milestone.delete({ where: { id } })
        return id
    },
    
    // Requirements (Partial impl for MVP)
    addProjectRequirement: async (_, { projectId, roleId, resourceCount, monthlyHours }) => {
        return prisma.projectRequirement.create({
            data: { projectId, roleId, resourceCount, monthlyHours },
            include: { role: true, skills: true }
        })
    },
    
    removeProjectRequirement: async (_, { projectId, requirementId }) => {
        await prisma.projectRequirement.delete({ where: { id: requirementId } })
        return true
    },

    addRequirementSkill: async (_, { projectId, requirementId, skillName, level }) => {
        // Upsert skill
        let skill = await prisma.skill.findUnique({ where: { name: skillName } })
        if (!skill) {
            skill = await prisma.skill.create({ data: { name: skillName } })
        }
        
        // Check if relation exists (since we missed @@unique in schema)
        const existing = await prisma.requirementSkill.findFirst({
            where: { requirementId, skillId: skill.id }
        })
        
        if (existing) {
            await prisma.requirementSkill.update({
                where: { id: existing.id },
                data: { level }
            })
        } else {
            await prisma.requirementSkill.create({
                data: { requirementId, skillId: skill.id, level }
            })
        }
        
        return { ...skill, level }
    },
    
    removeRequirementSkill: async (_, { projectId, requirementId, skillId }) => {
        await prisma.requirementSkill.deleteMany({
            where: { requirementId, skillId } // deleteMany is searching by non-unique, which is fine
        })
        return true
    },
  },
  
  Collaborator: {
      joinDate: (parent) => parent.joinDate?.toISOString(),
      skills: async (parent) => {
          if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
               return parent.skills
          }
           return await prisma.collaboratorSkill.findMany({
               where: { collaboratorId: parent.id },
               include: { skill: true }
           })
      },
      roles: async (parent) => {
          if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(cr => cr.role)
          } 
           const cr = await prisma.collaboratorRole.findMany({
               where: { collaboratorId: parent.id },
               include: { role: true }
           })
           return cr.map(c => c.role)
      },
      hardware: async (parent) => {
          if (parent.hardware) return parent.hardware
          return await prisma.hardware.findMany({
              where: { collaboratorId: parent.id }
          })
      },
      holidayCalendar: async (parent) => {
          if (parent.holidayCalendar !== undefined) return parent.holidayCalendar
          return await prisma.holidayCalendar.findUnique({
              where: { collaboratorId: parent.id }
          })
      },
      customFields: async (parent) => {
          if (parent.customFieldValues) return parent.customFieldValues
          return await prisma.customFieldValue.findMany({
              where: { collaboratorId: parent.id },
              include: { fieldDefinition: true }
          })
      },
      isActive: (parent) => parent.isActive ?? true
  },
  
  Allocation: {
      hours: (parent) => (parent.dedicationPercentage / 100) * 160,
      roles: async (parent) => {
          if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(ar => ar.role)
          } 
           const rs = await prisma.allocationRole.findMany({
               where: { allocationId: parent.id },
               include: { role: true }
           })
           return rs.map(ar => ar.role)
      },
      supervisors: async (parent) => {
          return await prisma.allocationHierarchy.findMany({
              where: { subordinateId: parent.id },
              include: { 
                  hierarchyType: true,
                  supervisor: {
                      include: {
                          collaborator: true
                      }
                  }
              }
          })
      },
      subordinates: async (parent) => {
          return await prisma.allocationHierarchy.findMany({
              where: { supervisorId: parent.id },
              include: { 
                  hierarchyType: true,
                  subordinate: {
                      include: {
                          collaborator: true
                      }
                  }
              }
          })
      }
  },
  
  HolidayCalendar: {
      holidays: (parent) => {
          try {
              return JSON.parse(parent.holidays)
          } catch {
              return []
          }
      },
      lastModified: (parent) => parent.lastModified?.toISOString()
  },
  
  ProjectRequirement: {
      skills: async (parent) => {
          if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
             return parent.skills.map(rs => ({ 
                 id: rs.id,
                 skill: rs.skill,
                 name: rs.skill.name,
                 level: rs.level 
             }))
          }
          const rs = await prisma.requirementSkill.findMany({
               where: { requirementId: parent.id },
               include: { skill: true }
           })
           return rs.map(r => ({ 
               id: r.id, 
               skill: r.skill,
               name: r.skill.name,
               level: r.level 
           }))
      }
  }


  WorkCenter: {
      publicHolidayCalendars: (parent) => prisma.publicHolidayCalendar.findMany({ where: { workCenterId: parent.id } })
  },

  PublicHolidayCalendar: {
      holidays: (parent) => {
          try {
              return JSON.parse(parent.holidays) 
          } catch {
              return []
          }
      }
  }
}
