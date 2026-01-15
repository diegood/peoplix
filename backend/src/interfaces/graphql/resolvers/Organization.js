
import { prisma } from '../../../infrastructure/database/client.js'

const ORG_ADMIN = 1

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

        return prisma.organization.findMany({ orderBy: { createdAt: 'desc' }})
    },
    organizationAdmins: async (_, { organizationId }, context) => {

        
        return prisma.collaborator.findMany({
            where: { 
                organizationId,
                systemRole: ORG_ADMIN
            },
            include: { user: true }
        })
    },
    totalActiveUsers: async (_, __, context) => {

        return prisma.user.count()
    }
  },
  Mutation: {
    createOrganization: async (_, { name, tag, adminEmail, adminPassword, adminFirstName, adminLastName, linkExistingUser }, context) => {


      const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
      
      if (existingUser && !linkExistingUser) {
          throw new Error('User with this email already exists')
      }

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

          let userId = existingUser?.id;

          if (!existingUser) {
              const newUser = await tx.user.create({
                  data: {
                      email: adminEmail,
                      username: adminEmail, // Default username
                      password: adminPassword, 
                      isSuperAdmin: false // Default
                  }
              })
              userId = newUser.id;
          }

          // Check if already a collaborator (shouldn't happen for new org, but good practice)
          // For a new org, we don't need to check collision because org is new.

          await tx.collaborator.create({
              data: {
                  userId: userId,
                  organizationId: org.id,
                  firstName: adminFirstName,
                  lastName: adminLastName,
                  systemRole: ORG_ADMIN,
                  contractedHours: 160,
                  joinDate: new Date(),
              }
          })

          return org
      })
    },

    updateOrganization: async (_, { id, name, tag, workingSchedule }, context) => {
      const user = context.user
      
      let targetOrgId = user.organizationId
      
      if (id && user.isSuperAdmin) {
          targetOrgId = id
      } else if (id && id !== user.organizationId) {
           throw new Error('Forbidden: You can only update your own organization')
      }


      const data = {}
      if (name) data.name = name
      if (tag) {
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

        return prisma.organization.update({
            where: { id },
            data: { isActive }
        })
    },

    deleteOrganization: async (_, { id }, context) => {

        await prisma.organization.delete({ where: { id } })
        return true
    }
  },
  Organization: {
      admins: (parent) => {
          return prisma.collaborator.findMany({
              where: { 
                  organizationId: parent.id,
                  systemRole: ORG_ADMIN 
              },
              include: { user: true }
          })
      },
      activeCollaboratorsCount: (parent) => {
          return prisma.collaborator.count({
              where: {
                  organizationId: parent.id,
                  isActive: true
              }
          })
      }
  }
}
