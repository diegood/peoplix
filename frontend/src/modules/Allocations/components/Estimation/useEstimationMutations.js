import { useMutation } from '@vue/apollo-composable'
import { 
    CREATE_TASK, 
    UPDATE_TASK, 
    UPDATE_WORK_PACKAGE, 
    ESTIMATE_TASK, 
    DELETE_WORK_PACKAGE, 
    ADD_TASK_DEPENDENCY, 
    REMOVE_TASK_DEPENDENCY,
    DELETE_TASK
} from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'

export function useEstimationMutations(emitRefetch) {
    const notificationStore = useNotificationStore()

    const { mutate: updateTask } = useMutation(UPDATE_TASK)
    const { mutate: estimateTask } = useMutation(ESTIMATE_TASK)
    const { mutate: deleteWorkPackage } = useMutation(DELETE_WORK_PACKAGE)
    const { mutate: updateWorkPackage } = useMutation(UPDATE_WORK_PACKAGE)
    const { mutate: createTask } = useMutation(CREATE_TASK)
    const { mutate: addTaskDependency } = useMutation(ADD_TASK_DEPENDENCY)
    const { mutate: removeTaskDependency } = useMutation(REMOVE_TASK_DEPENDENCY)
    const { mutate: deleteTask } = useMutation(DELETE_TASK)

    const handleUpdateTaskName = async (id, name) => {
        try {
            await updateTask({ id, name })
        } catch (e) {
            console.error(e)
        }
    }

    const handleUpdateTaskDesc = async (id, description) => {
        try {
            await updateTask({ id, description })
            if (emitRefetch) emitRefetch()
        } catch (e) {
            console.error(e)
            notificationStore.showToast('Error al actualizar descripción', 'error')
        }
    }

    const handleDeleteWP = async (id) => {
        if (confirm('¿Eliminar funcionalidad y todas sus tareas?')) {
            await deleteWorkPackage({ id })
            if (emitRefetch) emitRefetch()
        }
    }

    const handleUpdateWPDate = async (id, name, date) => {
        if (!date) return
        try {
            await updateWorkPackage({ id, name, startDate: date })
            if (emitRefetch) emitRefetch()
        } catch(err) {
            notificationStore.showToast(err.message, 'error')
        }
    }

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateWorkPackage({ id, status })
            if (emitRefetch) emitRefetch()
            notificationStore.showToast('Estado actualizado', 'success')
        } catch (e) {
            notificationStore.showToast('Error al actualizar estado', 'error')
            console.error(e)
        }
    }
    
    const handleDeleteTask = async (taskId) => {
        if (confirm('¿Eliminar tarea?')) {
            try {
                await deleteTask({ id: taskId })
                if (emitRefetch) emitRefetch()
                notificationStore.showToast('Tarea eliminada', 'success')
            } catch (e) {
                console.error(e)
                notificationStore.showToast('Error al eliminar tarea', 'error')
            }
        }
    }

    const handleAddDependency = async (taskId, predecessorId) => {
        if (!predecessorId) return
        try {
            await addTaskDependency({ taskId, predecessorId })
            if (emitRefetch) emitRefetch()
        } catch (e) {
             notificationStore.showToast(e.message, 'error')
        }
    }

    const handleRemoveDependency = async (taskId, predecessorId) => {
        try {
            await removeTaskDependency({ taskId, predecessorId })
            if (emitRefetch) emitRefetch()
        } catch (e) {
             console.error(e)
        }
    }

    return {
        updateTask,
        estimateTask,
        createTask,
        handleUpdateTaskName,
        handleUpdateTaskDesc,
        handleDeleteWP,
        handleUpdateWPDate,
        handleUpdateStatus,
        handleDeleteTask,
        handleAddDependency,
        handleRemoveDependency
    }
}
