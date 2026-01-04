import { WorkPackageService } from '../../../application/services/WorkPackageService.js'
import { TaskService } from '../../../application/services/TaskService.js'
import { ConfigurationService } from '../../../application/services/ConfigurationService.js'

const workPackageService = new WorkPackageService()
const taskService = new TaskService()
const configurationService = new ConfigurationService()

export const workPackageResolvers = {
    Query: {
        projectWorkPackages: (_, { projectId }) => workPackageService.getByProject(projectId),
        workPackageStatuses: (_, { organizationId }) => configurationService.getWorkPackageStatuses(organizationId),
        task: (_, { id }) => taskService.getById(id)
    },
    Mutation: {
        createWorkPackage: (_, args) => workPackageService.create(args),
        updateWorkPackage: (_, { id, ...args }, context) => {
             const userId = context.user ? context.user.userId : null;
             return workPackageService.update(id, args, userId);
        },
        deleteWorkPackage: (_, { id }) => workPackageService.delete(id),
        
        createTask: (_, args) => taskService.create(args),
        updateTask: (_, { id, ...args }) => taskService.update(id, args),
        deleteTask: (_, { id }) => taskService.delete(id),
        
        estimateTask: (_, args) => taskService.estimateTask(args),
        
        addTaskDependency: (_, { taskId, predecessorId }) => taskService.addDependency(taskId, predecessorId),
        removeTaskDependency: (_, { taskId, predecessorId }) => taskService.removeDependency(taskId, predecessorId),

        createWorkPackageStatus: (_, args) => configurationService.createWorkPackageStatus(args),
        updateWorkPackageStatus: (_, { id, ...args }) => configurationService.updateWorkPackageStatus(id, args),
        createWorkPackageStatus: (_, args) => configurationService.createWorkPackageStatus(args),
        updateWorkPackageStatus: (_, { id, ...args }) => configurationService.updateWorkPackageStatus(id, args),
        deleteWorkPackageStatus: (_, { id }) => configurationService.deleteWorkPackageStatus(id),

        createWorkPackageRecurrentEvent: (_, args) => workPackageService.createRecurrentEvent(args),
        deleteWorkPackageRecurrentEvent: (_, { id }) => workPackageService.deleteRecurrentEvent(id)
    }
}
