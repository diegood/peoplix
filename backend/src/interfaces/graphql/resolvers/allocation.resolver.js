import { AllocationService } from '../../../application/services/AllocationService.js'

const service = new AllocationService()

export const allocationResolver = {
  Mutation: {
    createAllocation: (_, args) => service.create(args),
    updateAllocation: (_, { allocationId, ...data }) => service.update(allocationId, data),
    deleteAllocation: async (_, { allocationId }) => {
        await service.delete(allocationId)
        return true
    },
    addAllocationRole: (_, { allocationId, roleId }) => service.addRole(allocationId, roleId),
    removeAllocationRole: (_, { allocationId, roleId }) => service.removeRole(allocationId, roleId),
    addAllocationHierarchy: (_, { subordinateAllocId, supervisorAllocId, typeId }) => service.addHierarchy(subordinateAllocId, supervisorAllocId, typeId),
    removeAllocationHierarchy: (_, { hierarchyId }) => service.removeHierarchy(hierarchyId)
  },
  Allocation: {
      hours: (parent) => parent.hours || (parent.dedicationPercentage / 100) * 160, // Field alias or computation
      roles: (parent) => {
           if (parent.roles && parent.roles[0] && parent.roles[0].role) {
               return parent.roles.map(ar => ar.role)
           }
           return []
      },
      supervisors: (parent) => service.getSupervisors(parent.id),
      subordinates: (parent) => service.getSubordinates(parent.id)
  }
}
