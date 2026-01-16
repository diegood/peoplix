import { useMutation } from '@vue/apollo-composable'
import { 
    CREATE_ALLOCATION, 
    UPDATE_ALLOCATION, 
    DELETE_ALLOCATION, 
    ADD_ALLOCATION_ROLE, 
    REMOVE_ALLOCATION_ROLE 
} from '@/modules/Allocations/graphql/allocation.queries'
import { useNotificationStore } from '@/stores/notificationStore'

export function useAllocationActions(refetchQueries = ['GetProjects']) {
    const notificationStore = useNotificationStore()
    
    const { mutate: createAllocation } = useMutation(CREATE_ALLOCATION, { refetchQueries: [...refetchQueries, 'GetCollaborators'] })
    const { mutate: updateAllocation } = useMutation(UPDATE_ALLOCATION, { refetchQueries })
    const { mutate: deleteAllocation } = useMutation(DELETE_ALLOCATION, { refetchQueries })
    const { mutate: addAllocationRole } = useMutation(ADD_ALLOCATION_ROLE, { refetchQueries })
    const { mutate: removeAllocationRole } = useMutation(REMOVE_ALLOCATION_ROLE, { refetchQueries })

    const confirmAssignment = async (data, selectedWeek) => {
        await createAllocation({
            projectId: data.projectId,
            collaboratorId: data.collaboratorId,
            roleId: data.roleId,
            percentage: Number(data.percentage),
            startWeek: selectedWeek
        })
    }

    const deleteAlloc = async (allocation, selectedWeek, getPrevWeek) => {
        if (!allocation) return
        const confirmed = await notificationStore.showDialog("¿Eliminar asignación? Si comenzó antes, se cerrará hasta la semana previa.")
        if (!confirmed) return
    
        const isStartWeek = allocation.startWeek === selectedWeek
        if (isStartWeek) {
            await deleteAllocation({ id: allocation.id })
        } else {
            const prevWeek = getPrevWeek(selectedWeek)
            await updateAllocation({ allocationId: allocation.id, percentage: allocation.dedicationPercentage || 0, endWeek: prevWeek })
        }
    }

    const updateAllocationPercentage = async (allocation, newPercentage, selectedWeek, localProjects) => {
        const newPerc = Number(newPercentage)
        if (allocation.dedicationPercentage === newPerc) return
    
        if (allocation.startWeek === selectedWeek) {
            await updateAllocation({ allocationId: allocation.id, percentage: newPerc })
        } else {
            if (await notificationStore.showDialog("Cambiar dedicación implica crear un nuevo registro desde esta semana. ¿Continuar?")) {
                let w = parseInt(selectedWeek.split('-W')[1])
                let y = parseInt(selectedWeek.split('-W')[0])
                let prevWeek = ''
                if (w > 1) {
                    prevWeek = `${y}-W${(w-1).toString().padStart(2,'0')}`
                } else {
                    prevWeek = `${y-1}-W52`
                }
                
                await updateAllocation({ allocationId: allocation.id, percentage: Number(allocation.dedicationPercentage) || 0, endWeek: prevWeek })
                
                const primaryRole = allocation.roles[0]
                if (primaryRole) {
                    let projectId = allocation.project?.id
                    if (!projectId && localProjects) {
                         projectId = localProjects.find(p => p.allocations.some(a => a.id === allocation.id))?.id
                    }

                    if (projectId) {
                        const res = await createAllocation({
                            projectId,
                            collaboratorId: allocation.collaborator.id,
                            roleId: primaryRole.id,
                            percentage: newPerc,
                            startWeek: selectedWeek
                        })
                        
                        const newId = res.data.createAllocation.id
                        for (let i = 1; i < allocation.roles.length; i++) {
                            await addAllocationRole({ allocationId: newId, roleId: allocation.roles[i].id })
                        }
                    }
                }
            }
        }
    }

    const addRole = async (allocation, roleId) => {
        if (!roleId) return
        await addAllocationRole({ allocationId: allocation.id, roleId })
    }

    const removeRole = async (allocation, roleId) => {
        if (await notificationStore.showDialog("¿Desasignar este rol?")) {
            await removeAllocationRole({ allocationId: allocation.id, roleId })
        }
    }

    return {
        confirmAssignment,
        deleteAlloc,
        updateAllocationPercentage,
        addRole,
        removeRole
    }
}
