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
        allocations: true
        // roles? If modeled
      }
    }),
    project: (_, { id }) => prisma.project.findUnique({
      where: { id },
      include: {
        allocations: {
           include: { 
             collaborator: true, 
             roles: { include: { role: true } } 
           }
        },
        milestones: { include: { milestoneType: true } },
        requiredRoles: { include: { role: true, skills: { include: { skill: true } } } }
      }
    }),
    technologies: () => prisma.technology.findMany(),
    milestoneTypes: () => prisma.milestoneType.findMany({ orderBy: { name: 'asc' }})
  },
  
  Mutation: {
    createTechnology: (_, { name }) => prisma.technology.create({ data: { name } }),
    deleteTechnology: async (_, { id }) => {
        await prisma.technology.delete({ where: { id } })
        return id
    },
    createRole: (_, { name }) => prisma.role.create({ data: { name } }),
    deleteRole: async (_, { id }) => {
       await prisma.role.delete({ where: { id } })
       return true
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
    
    createProject: (_, { name, contractedHours }) => prisma.project.create({
      data: { name, contractedHours }
    }),
    
    createCollaborator: (_, { name, contractedHours }) => prisma.collaborator.create({
      data: { name, contractedHours }
    }),
    
    addCollaboratorSkill: async (_, { collaboratorId, skillName, level }) => {
        // Upsert skill (find or create)
        let skill = await prisma.skill.findUnique({ where: { name: skillName } })
        if (!skill) {
            skill = await prisma.skill.create({ data: { name: skillName } }) // level on skill is default/stub, level is on relation
        }
        
        // Upsert relation
        await prisma.collaboratorSkill.upsert({
            where: {
                collaboratorId_skillId: {
                    collaboratorId,
                    skillId: skill.id
                }
            },
            update: { level },
            create: {
                collaboratorId,
                skillId: skill.id,
                level
            }
        })
        
        return { ...skill, level } // Return skill with the level specific to this relation (?) 
        // Schema says returns Skill. Skill type has 'level'. 
        // In our robust model, Skill is generic name, and CollaboratorSkill has level.
        // But for MVP front compatibility, we might be returning the Relation's level overlaid on Skill.
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
  
  // Field Resolvers to flatten structure
  Allocation: {
      hours: (parent) => (parent.dedicationPercentage / 100) * 160,
      roles: async (parent) => {
          // If we already loaded roles via include, map them
          if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(ar => ar.role)
          } 
          // Otherwise fetch
           const rs = await prisma.allocationRole.findMany({
               where: { allocationId: parent.id },
               include: { role: true }
           })
           return rs.map(ar => ar.role)
      }
  },
  
  Collaborator: {
      skills: async (parent) => {
          if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
               return parent.skills.map(cs => ({ ...cs.skill, level: cs.level }))
          }
           const cs = await prisma.collaboratorSkill.findMany({
               where: { collaboratorId: parent.id },
               include: { skill: true }
           })
           return cs.map(c => ({ ...c.skill, level: c.level }))
      },
      roles: async (parent) => {
          if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(cr => cr.role)
          } 
          // If fetched but simple relation object (unlikely for many-to-many explicit)
          // or if not fetched
           const cr = await prisma.collaboratorRole.findMany({
               where: { collaboratorId: parent.id },
               include: { role: true }
           })
           return cr.map(c => c.role)
      }
  },
  
  ProjectRequirement: {
      skills: async (parent) => {
          if (parent.skills && parent.skills[0] && parent.skills[0].skill) {
             return parent.skills.map(rs => ({ ...rs.skill, level: rs.level }))
          }
          const rs = await prisma.requirementSkill.findMany({
               where: { requirementId: parent.id },
               include: { skill: true }
           })
           return rs.map(r => ({ ...r.skill, level: r.level }))
      }
  }
}
