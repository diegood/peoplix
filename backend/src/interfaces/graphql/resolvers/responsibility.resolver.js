import { ResponsibilityService } from '../../../application/services/ResponsibilityService.js'

const service = new ResponsibilityService()

export const responsibilityResolver = {
    Mutation: {
        addResponsibility: (_, args) => service.create(args),
        removeResponsibility: (_, { id }) => service.delete(id)
    },
    Project: {
        responsibilities: (parent) => service.getByProject(parent.id)
    },
    WorkPackage: {
        responsibilities: (parent, _, { user }) => service.getByProject(user.organizationId).then(all => all.filter(r => r.workPackageId === parent.id)) 
    }
}
