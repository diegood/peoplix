
import { prisma } from '../../../infrastructure/database/client.js'

export const organizationResolvers = {
  Query: {
    organization: async (_, __, context) => {
      const user = context.user
      if (!user || !user.organizationId) throw new Error('Unauthorized')
      
      return prisma.organization.findUnique({
        where: { id: user.organizationId }
      })
    },
    allOrganizations: async (_, __, context) => {
        const user = context.user
        // 0: Super Admin
        if (!user || user.role !== 0) throw new Error('Unauthorized: Only Super Admin can list all organizations')
        
        return prisma.organization.findMany({ orderBy: { createdAt: 'desc' }})
    },
    organizationAdmins: async (_, { organizationId }, context) => {
        const user = context.user
        // 0: Super Admin
        if (!user || user.role !== 0) throw new Error('Unauthorized: Only Super Admin can view org admins')
        
        return prisma.collaborator.findMany({
            where: { 
                organizationId,
                systemRole: 1 // Org Admin role
            },
            include: { user: true }
        })
    }
  },
  Mutation: {
    createOrganization: async (_, { name, tag, adminEmail, adminPassword, adminFirstName, adminLastName }, context) => {
      const user = context.user
      // 0: Super Admin
      if (!user || user.role !== 0) throw new Error('Unauthorized: Only Super Admin can create organizations')

      const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
      if (existingUser) throw new Error('User with this email already exists')

      if (tag) {
          const existingOrg = await prisma.organization.findUnique({ where: { tag } })
          if (existingOrg) throw new Error('Organization with this tag already exists')
      }

      return prisma.$transaction(async (tx) => {
          const org = await tx.organization.create({
              data: {
                  name,
                  tag: tag || 'ORG_' + Date.now(),
              }
          })

          const newUser = await tx.user.create({
              data: {
                  email: adminEmail,
                  password: adminPassword, 
              }
          })

          await tx.collaborator.create({
              data: {
                  userId: newUser.id,
                  organizationId: org.id,
                  firstName: adminFirstName,
                  lastName: adminLastName,
                  systemRole: 1, // Org Admin
                  contractedHours: 160,
                  joinDate: new Date(),
              }
          })

          return org
      })
    },

    updateOrganization: async (_, { id, name, tag, workingSchedule }, context) => {
      const user = context.user
      if (!user) throw new Error('Unauthorized')
      
      let targetOrgId = user.organizationId
      
      // If ID provided and user is Super Admin, allow override
      if (id && user.role === 0) {
          targetOrgId = id
      } else if (id && id !== user.organizationId) {
           throw new Error('Forbidden: You can only update your own organization')
      }
      
      // Allow Super Admin (0) or Org Admin (1)
      if (user.role > 1) throw new Error('Forbidden: Only Admins can update Organization settings')

      const data = {}
      if (name) data.name = name
      if (tag) {
           // Check uniqueness if tag is changing
           const existingOrg = await prisma.organization.findUnique({ where: { tag } })
           if (existingOrg && existingOrg.id !== targetOrgId) {
               throw new Error('Organization with this tag already exists')
           }
           data.tag = tag
      }
      if (workingSchedule) data.workingSchedule = workingSchedule

      return prisma.organization.update({
        where: { id: targetOrgId },
        data
      })
    },

    toggleOrganizationStatus: async (_, { id, isActive }, context) => {
        const user = context.user
        // 0: Super Admin
        if (!user || user.role !== 0) throw new Error('Unauthorized: Only Super Admin can change organization status')

        return prisma.organization.update({
            where: { id },
            data: { isActive }
        })
    }
  },
  Organization: {
      admins: (parent) => {
          return prisma.collaborator.findMany({
              where: { 
                  organizationId: parent.id,
                  systemRole: 1 
              },
              include: { user: true }
          })
      }
  }
}
