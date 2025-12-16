import { WorkPackageService } from '../../../application/services/WorkPackageService.js'
import { TaskService } from '../../../application/services/TaskService.js'

const workPackageService = new WorkPackageService()
const taskService = new TaskService()

export const workPackageResolvers = {
    Query: {
        projectWorkPackages: (_, { projectId }) => workPackageService.getByProject(projectId),
        task: (_, { id }) => taskService.getById(id)
    },
    Mutation: {
        createWorkPackage: (_, args) => workPackageService.create(args),
        updateWorkPackage: (_, { id, ...args }) => workPackageService.update(id, args),
        deleteWorkPackage: (_, { id }) => workPackageService.delete(id),
        
        createTask: (_, args) => taskService.create(args),
        updateTask: (_, { id, ...args }) => taskService.update(id, args),
        deleteTask: (_, { id }) => taskService.delete(id),
        
        estimateTask: (_, args) => taskService.estimateTask(args),
        
        addTaskDependency: (_, { taskId, predecessorId }) => taskService.addDependency(taskId, predecessorId),
        removeTaskDependency: (_, { taskId, predecessorId }) => taskService.removeDependency(taskId, predecessorId)
    }
}
