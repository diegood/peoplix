
import { prisma } from '../../../infrastructure/database/client.js'

export const organizationResolvers = {
  Query: {
    organization: async (_, __, context) => {
      const user = context.user
      if (!user || !user.organizationId) throw new Error('Unauthorized')
      
      return prisma.organization.findUnique({
        where: { id: user.organizationId }
      })
    }
  },
  Mutation: {
    updateOrganization: async (_, { name, tag, workingSchedule }, context) => {
      const user = context.user
      if (!user || !user.organizationId) throw new Error('Unauthorized')
      
      if (user.role !== 1) throw new Error('Forbidden: Only Admins can update Organization settings')

      const data = {}
      if (name) data.name = name
      if (tag) data.tag = tag
      if (workingSchedule) data.workingSchedule = workingSchedule

      return prisma.organization.update({
        where: { id: user.organizationId },
        data
      })
    }
  }
}
