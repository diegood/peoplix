
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { ADD_ALLOCATION_HIERARCHY, REMOVE_ALLOCATION_HIERARCHY } from '@/graphql/mutations'
import { CREATE_ALLOCATION } from '@/modules/Allocations/graphql/allocation.queries'
import { useNotificationStore } from '@/stores/notificationStore'
import { dayjs } from '@/config'

export function useHierarchyActions(props, allNodes, getDisplayName) {
    
    const notificationStore = useNotificationStore()
    
    const editingAllocationId = ref(null)
    const selectedSupervisorId = ref('')
    const selectedTypeId = ref('')
    const showAddForm = ref(false)

    const { mutate: addHierarchy } = useMutation(ADD_ALLOCATION_HIERARCHY, { 
        refetchQueries: ['GetProjects', 'GetProjectDetails'] 
    })
    const { mutate: removeHierarchy } = useMutation(REMOVE_ALLOCATION_HIERARCHY, { 
        refetchQueries: ['GetProjects', 'GetProjectDetails'] 
    })
    const { mutate: createAllocation } = useMutation(CREATE_ALLOCATION, { 
        refetchQueries: ['GetProjects', 'GetProjectDetails'] 
    })


    const startEdit = (node) => {
        if (node.isVirtual) {
            notificationStore.showToast("No se puede editar una asignación virtual (sólo lectura desde Organización)", "info")
            return
        }
        editingAllocationId.value = node.id
        selectedSupervisorId.value = ''
        selectedTypeId.value = ''
        showAddForm.value = false
    }

    const handleAdd = async () => {
        if (!selectedSupervisorId.value || !selectedTypeId.value) return
        
        let supervisorAllocId = selectedSupervisorId.value
        const supervisorNode = allNodes.value.find(n => n.id === selectedSupervisorId.value)
        
        try {
            if (supervisorNode?.isVirtual) {
                let role = supervisorNode.collaborator.roles?.find(r => r.isAdministrative)
                
                if (!role) role = supervisorNode.collaborator.roles?.[0]
                
                let roleId = role?.id

                if (!roleId && props.project.requiredRoles?.length > 0) {
                     roleId = props.project.requiredRoles[0].role?.id
                }

                if (!roleId) {
                    notificationStore.showToast("El supervisor no tiene roles directos ni hay roles requeridos en el proyecto para asignarle.", "error")
                    return
                }

                notificationStore.showToast("Asignando supervisor al proyecto...", "info")
                const currentWeek = dayjs().format('YYYY-[W]WW')
                
                const res = await createAllocation({
                    projectId: props.project.id,
                    collaboratorId: supervisorNode.collaborator.id,
                    roleId: roleId,
                    percentage: 0,
                    startWeek: currentWeek
                })
                
                if (res?.data?.createAllocation?.id) {
                    supervisorAllocId = res.data.createAllocation.id
                } else {
                    throw new Error("Falló la auto-asignación")
                }
            }

            await addHierarchy({
                subordinateAllocId: editingAllocationId.value,
                supervisorAllocId: supervisorAllocId,
                typeId: selectedTypeId.value
            })
            showAddForm.value = false
            selectedSupervisorId.value = ''
            selectedTypeId.value = ''
        } catch (e) {
            notificationStore.showToast("Error al asignar supervisor: " + e.message, 'error')
        }
    }

    const handleRemove = async (hierarchyId) => {
        if (String(hierarchyId).startsWith('org-')) {
             notificationStore.showToast("No se puede eliminar una relación de Organización desde el Proyecto", "warning")
             return
        }

        if (!await notificationStore.showDialog("¿Eliminar esta relación?")) return
        try {
            await removeHierarchy({ hierarchyId })
        } catch (e) {
            notificationStore.showToast(e.message, 'error')
        }
    }

    return {
        editingAllocationId,
        selectedSupervisorId,
        selectedTypeId,
        showAddForm,
        startEdit,
        handleAdd,
        handleRemove
    }
}
