<script setup>
import { ref, computed } from 'vue'
import { X, Plus, Trash2, Save } from 'lucide-vue-next'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
    show: Boolean,
    project: Object
})

const emit = defineEmits(['close'])
const notificationStore = useNotificationStore()

// Queries
const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
    }
  }
`
const { result: rolesResult } = useQuery(GET_ROLES)
const allRoles = computed(() => rolesResult.value?.roles || [])

// Mutations
const ADD_REQUIREMENT = gql`
  mutation AddProjectRequirement($projectId: ID!, $roleId: ID!, $resourceCount: Int, $monthlyHours: Int) {
    addProjectRequirement(projectId: $projectId, roleId: $roleId, resourceCount: $resourceCount, monthlyHours: $monthlyHours) {
      id
      role { id name }
      resourceCount
      monthlyHours
    }
  }
`
const UPDATE_REQUIREMENT = gql`
  mutation UpdateProjectRequirement($requirementId: ID!, $resourceCount: Int, $monthlyHours: Int) {
    updateProjectRequirement(requirementId: $requirementId, resourceCount: $resourceCount, monthlyHours: $monthlyHours) {
      id
      resourceCount
      monthlyHours
    }
  }
`
const REMOVE_REQUIREMENT = gql`
  mutation RemoveProjectRequirement($projectId: ID!, $requirementId: ID!) {
    removeProjectRequirement(projectId: $projectId, requirementId: $requirementId)
  }
`

const { mutate: addReq } = useMutation(ADD_REQUIREMENT, { refetchQueries: ['GetProjects'] })
const { mutate: updateReq } = useMutation(UPDATE_REQUIREMENT) 
const { mutate: removeReq } = useMutation(REMOVE_REQUIREMENT, { refetchQueries: ['GetProjects'] })

// Local State
const newRole = ref('')
const editingValues = ref({})

const availableRoles = computed(() => {
    const assignedIds = props.project?.requiredRoles?.map(r => r.role.id) || []
    return allRoles.value.filter(r => !assignedIds.includes(r.id))
})

const handleAdd = async () => {
    if (!newRole.value) return
    try {
        await addReq({
            projectId: props.project.id,
            roleId: newRole.value,
            resourceCount: 1,
            monthlyHours: 40
        })
        newRole.value = ''
        notificationStore.showToast("Rol añadido correctament", "success")
    } catch (e) {
        notificationStore.showToast("Error al añadir rol: " + e.message, "error")
    }
}

const handleRemove = async (reqId) => {
    if (!await notificationStore.showDialog("¿Eliminar este requerimiento del proyecto?")) return
    try {
        await removeReq({ projectId: props.project.id, requirementId: reqId })
        notificationStore.showToast("Requerimiento eliminado", "success")
    } catch (e) {
        notificationStore.showToast(e.message, "error")
    }
}

const startEdit = (req, field) => {
    if (!editingValues.value[req.id]) editingValues.value[req.id] = { ...req }
}

const handleUpdate = async (req, field) => {
    const val = editingValues.value[req.id]?.[field]
    if (val === undefined || val === req[field]) return

    try {
        await updateReq({
            requirementId: req.id,
            resourceCount: Number(editingValues.value[req.id].resourceCount || req.resourceCount),
            monthlyHours: Number(editingValues.value[req.id].monthlyHours || req.monthlyHours)
        })
        notificationStore.showToast("Actualizado correctamente", "success")
        // No need to refetch full project maybe? optimistic update?
        // Let's rely on computed reactivity if possible, but actually we need to update props or refetch.
        // Since we are not refetching explicitly for update, let's hope Apollo cache handles it or we trigger refetch.
        // Actually, refetchQueries: ['GetProjects'] on mutation is safest. 
        // Adding it to updateReq options above.
    } catch (e) {
        notificationStore.showToast("Error al actualizar: " + e.message, "error")
    }
}
// Add refetch to update as well
const { mutate: updateReqWithRefetch } = useMutation(UPDATE_REQUIREMENT, { refetchQueries: ['GetProjects'] })

const saveField = async (req) => {
    const data = editingValues.value[req.id]
    if (!data) return
    try {
        await updateReqWithRefetch({
            requirementId: req.id,
            resourceCount: Number(data.resourceCount),
            monthlyHours: Number(data.monthlyHours)
        })
        notificationStore.showToast("Actualizado", "success")
        delete editingValues.value[req.id]
    } catch (e) {
        notificationStore.showToast(e.message, "error")
    }
}

</script>

<template>
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="$emit('close')">
        <div class="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Configuración de Recursos</h2>
                    <p class="text-sm text-gray-500">{{ project.name }}</p>
                </div>
                <button @click="$emit('close')" class="p-2 hover:bg-gray-200 rounded-full transition">
                    <X size="20" class="text-gray-500" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
                
                <!-- Add New Role -->
                <div class="flex gap-2 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <select v-model="newRole" class="flex-1 border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="" disabled>Seleccionar Rol para añadir...</option>
                        <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                            {{ role.name }}
                        </option>
                    </select>
                    <button @click="handleAdd" :disabled="!newRole" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        <Plus size="16"/> Añadir
                    </button>
                </div>

                <!-- Existing Requirements -->
                <div class="space-y-3">
                    <div v-for="req in project.requiredRoles" :key="req.id" class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition">
                        <div class="w-1/3">
                            <span class="font-bold text-gray-800">{{ req.role.name }}</span>
                        </div>
                        
                        <div class="flex items-center gap-4">
                            <div class="flex flex-col items-center">
                                <label class="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Recursos</label>
                                <div class="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        :value="editingValues[req.id]?.resourceCount ?? req.resourceCount" 
                                        @input="(e) => { startEdit(req); editingValues[req.id].resourceCount = e.target.value }"
                                        class="w-16 text-center border rounded px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div class="flex flex-col items-center">
                                <label class="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Horas/Mes</label>
                                <div class="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        :value="editingValues[req.id]?.monthlyHours ?? req.monthlyHours" 
                                        @input="(e) => { startEdit(req); editingValues[req.id].monthlyHours = e.target.value }"
                                        class="w-16 text-center border rounded px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 ml-4">
                            <button v-if="editingValues[req.id]" @click="saveField(req)" class="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition" title="Guardar Cambios">
                                <Save size="18" />
                            </button>
                            <button @click="handleRemove(req.id)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar Rol">
                                <Trash2 size="18" />
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="project.requiredRoles.length === 0" class="text-center py-8 text-gray-400 italic">
                        No hay roles requeridos definidos.
                    </div>
                </div>

            </div>
            
            <div class="bg-gray-50 px-6 py-4 flex justify-end">
                <button @click="$emit('close')" class="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
</template>
