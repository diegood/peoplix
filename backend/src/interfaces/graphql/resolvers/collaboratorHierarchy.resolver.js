import { CollaboratorHierarchyService } from '../../../application/services/CollaboratorHierarchyService.js'

const service = new CollaboratorHierarchyService()

export const collaboratorHierarchyResolver = {
  Query: {
    orgHierarchy: (_, { organizationId }) => service.getHierarchy(organizationId)
  },
  Mutation: {
    addOrgHierarchy: (_, args, { user }) => {
      if (!user?.organizationId) throw new Error("User organization context required")
      return service.createRelation({ ...args, organizationId: user.organizationId })
    },
    removeOrgHierarchy: (_, { id }) => service.deleteRelation(id)
  }
}
