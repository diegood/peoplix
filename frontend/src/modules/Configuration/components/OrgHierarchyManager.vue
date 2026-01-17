<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ORG_HIERARCHY, ADD_ORG_HIERARCHY, REMOVE_ORG_HIERARCHY, GET_COLLABORATORS_WITH_ROLES } from '../graphql/hierarchy.queries'
import { GET_HIERARCHY_TYPES } from '@/graphql/queries'
import { useNotificationStore } from '@/stores/notificationStore'
import { Trash2, Network, Plus } from 'lucide-vue-next'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import OrgHierarchyTree from './OrgHierarchyTree.vue'

const props = defineProps({
    organizationId: {
        type: String,
        required: true
    }
})

const notificationStore = useNotificationStore()

const { result: hierarchyResult, refetch: refetchHierarchy } = useQuery(GET_ORG_HIERARCHY, () => ({
    organizationId: props.organizationId
}))

const { result: collabResult } = useQuery(GET_COLLABORATORS_WITH_ROLES)
const { result: typesResult } = useQuery(GET_HIERARCHY_TYPES)

const { mutate: addHierarchy } = useMutation(ADD_ORG_HIERARCHY)
const { mutate: removeHierarchy } = useMutation(REMOVE_ORG_HIERARCHY)

const hierarchy = computed(() => hierarchyResult.value?.orgHierarchy || [])
const collaborators = computed(() => collabResult.value?.collaborators || [])
const hierarchyTypes = computed(() => typesResult.value?.hierarchyTypes || [])

const supervisorOption = ref(null)
const subordinateOption = ref(null)
const newType = ref('')

const handleAdd = async () => {
    if (!supervisorOption.value || !subordinateOption.value || !newType.value) return
    if (supervisorOption.value.id === subordinateOption.value.id) {
        notificationStore.showToast("No puede ser su propio supervisor", "error")
        return
    }
    
    try {
        await addHierarchy({
            supervisorId: supervisorOption.value.id,
            subordinateId: subordinateOption.value.id,
            hierarchyTypeId: newType.value
        })
        subordinateOption.value = null
        await refetchHierarchy()
        notificationStore.showToast("Relación agregada", "success")
    } catch (e) {
        notificationStore.showToast("Error agregando relación: " + e.message, "error")
    }
}

const handleDelete = async (item) => {
    if(await notificationStore.showDialog("¿Eliminar esta relación?")) {
        try {
            await removeHierarchy({ id: item.id })
            await refetchHierarchy()
            notificationStore.showToast("Relación eliminada", "success")
        } catch (e) {
             notificationStore.showToast("Error: " + e.message, "error")
        }
    }
}

const customLabel = (collab) => {
    const roles = collab.roles.filter(r => r.isAdministrative).map(r => r.name).join(', ')
    return `${collab.firstName} ${collab.lastName} (${roles})`
}

</script>

<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Network class="text-blue-600"/> Arbol Administrativo (Organización)
        </h3>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h4 class="text-sm font-bold text-gray-700 mb-2">Nueva Relación</h4>
            <div class="flex flex-wrap gap-4 items-end">
                <div class="flex-1 min-w-[250px]">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
                    <VueMultiselect
                        v-model="supervisorOption"
                        :options="collaborators"
                        :custom-label="customLabel"
                        placeholder="Buscar colaborador..."
                        select-label="Seleccionar"
                        selected-label="Seleccionado"
                        deselect-label="Quitar"
                        track-by="id"
                    >
                        <template #noResult>No se encontraron resultados</template>
                    </VueMultiselect>
                </div>
                <div class="flex-1 min-w-[250px]">
                     <label class="block text-xs font-medium text-gray-500 mb-1">Subordinado</label>
                     <VueMultiselect
                        v-model="subordinateOption"
                        :options="collaborators"
                        :custom-label="customLabel"
                        placeholder="Buscar colaborador..."
                        select-label="Seleccionar"
                        selected-label="Seleccionado"
                        deselect-label="Quitar"
                        track-by="id"
                    >
                         <template #noResult>No se encontraron resultados</template>
                    </VueMultiselect>
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Tipo de Relación</label>
                    <select v-model="newType" class="w-full border rounded px-3 py-2 text-sm h-[40px] bg-white">
                        <option value="">Seleccionar...</option>
                        <option v-for="t in hierarchyTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                </div>
                <button @click="handleAdd" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm font-medium h-[40px]">
                    <Plus size="16"/> Agregar
                </button>
            </div>
        </div>

        <div class="mt-6">
             <OrgHierarchyTree 
                :hierarchy="hierarchy" 
                :collaborators="collaborators" 
                @delete-relation="(id) => handleDelete({ id })"
             />
        </div>
    </div>
</template>
