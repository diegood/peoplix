<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Estados de Paquetes de Trabajo
        </h2>

        <div v-if="!editingId && !creating" class="space-y-4">
            <div class="flex justify-end">
                <button @click="startCreate" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Nuevo Estado
                </button>
            </div>

            <div v-if="loading" class="text-gray-500 text-center py-4">Cargando estados...</div>
            <div v-else-if="statuses.length === 0" class="text-gray-500 text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
                No hay estados definidos via configuración.
            </div>

            <div v-else class="space-y-2">
                <div v-for="status in statuses" :key="status.id" class="border rounded-lg p-3 hover:bg-gray-50 flex justify-between items-center transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded border flex items-center justify-center font-bold text-xs" :style="{ backgroundColor: status.color, color: getContrastColor(status.color) }">
                            {{ status.order }}
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 flex items-center gap-2">
                                {{ status.name }}
                                <span v-if="status.isClosed" class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">Cerrado</span>
                            </h3>
                            <p class="text-xs text-gray-500">{{ status.color }}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button @click="startEdit(status)" class="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Editar">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                         <button @click="confirmDelete(status)" class="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="creating || editingId" class="bg-gray-50 p-4 rounded border border-gray-200">
             <h3 class="font-bold mb-4">{{ creating ? 'Nuevo Estado' : 'Editar Estado' }}</h3>
             <form @submit.prevent="saveStatus" class="space-y-4">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label class="block text-sm font-medium text-gray-700">Nombre</label>
                         <input v-model="form.name" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                     </div>
                     <div>
                         <label class="block text-sm font-medium text-gray-700">Orden</label>
                         <input v-model.number="form.order" type="number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                     </div>
                 </div>

                 <div class="flex items-center gap-2">
                     <input v-model="form.isClosed" id="isClosed" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                     <label for="isClosed" class="text-sm font-medium text-gray-700">Estado Final (Cerrado)</label>
                     <p class="text-xs text-gray-500 ml-2">(Las tareas en este estado no aparecerán en la planificación activa)</p>
                 </div>
                 
                 <div>
                     <label class="block text-sm font-medium text-gray-700">Color (Hex)</label>
                     <div class="flex gap-2 items-center mt-1">
                         <input v-model="form.color" @input="onColorInput" type="color" class="h-9 w-14 rounded cursor-pointer border border-gray-300 p-1 bg-white">
                         <input v-model="form.color" type="text" pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase">
                     </div>
                 </div>

                 <div class="flex justify-end gap-2 pt-2">
                     <button type="button" @click="cancelForm" class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                     <button type="submit" :disabled="saving" class="px-3 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                         {{ saving ? 'Guardando...' : 'Guardar' }}
                     </button>
                 </div>
             </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { GET_WORK_PACKAGE_STATUSES, CREATE_STATUS, UPDATE_STATUS, DELETE_STATUS } from '@/modules/Configuration/graphql/status.queries'
import { stringToColor, getContrastColor } from '@/helper/Colors'
import { watch } from 'vue'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()


const { result, loading, refetch } = useQuery(GET_WORK_PACKAGE_STATUSES, () => ( {organizationId: authStore.user?.organizationId}), {
    enabled: computed(() => !!authStore.user?.organizationId)
})

const { mutate: createStatus } = useMutation(CREATE_STATUS)
const { mutate: updateStatus } = useMutation(UPDATE_STATUS)
const { mutate: deleteStatus } = useMutation(DELETE_STATUS)

const statuses = computed(() => {
    return result.value?.workPackageStatuses 
           ? [...result.value.workPackageStatuses].sort((a,b) => a.order - b.order) 
           : []
})

const creating = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
    name: '',
    color: '#cccccc',
    color: '#cccccc',
    order: 0,
    isClosed: false
})

const colorManuallyChanged = ref(false)

watch(() => form.name, (newName) => {
    if (!colorManuallyChanged.value && newName) {
        form.color = stringToColor(newName)
    }
})

const onColorInput = () => { colorManuallyChanged.value = true }

const startCreate = () => {
    creating.value = true
    editingId.value = null
    form.name = ''
    form.color = '#cccccc'
    colorManuallyChanged.value = false
    form.order = statuses.value.length + 1
    form.isClosed = false
}

const startEdit = (status) => {
    creating.value = false
    editingId.value = status.id
    form.name = status.name
    form.color = status.color || '#cccccc'
    colorManuallyChanged.value = true
    form.order = status.order
    form.isClosed = status.isClosed || false
}

const cancelForm = () => {
    creating.value = false
    editingId.value = null
}

const saveStatus = async () => {
    saving.value = true
    try {
        if (creating.value) {
            await createStatus({
                organizationId: authStore.user.organizationId,
                name: form.name,
                color: form.color,
                order: form.order,
                isClosed: form.isClosed
            })
        } else {
            await updateStatus({
                id: editingId.value,
                name: form.name,
                color: form.color,
                order: form.order,
                isClosed: form.isClosed
            })
        }
        await refetch()
        cancelForm()
        notificationStore.showToast('Estado guardado correctamente', 'success')
    } catch(e) {
        console.error(e)
        notificationStore.showToast('Error al guardar: ' + e.message, 'error')
    } finally {
        saving.value = false
    }
}

const confirmDelete = async (status) => {
    if(confirm(`¿Eliminar estado "${status.name}"?`)) {
        try {
            await deleteStatus({ id: status.id })
            await refetch()
            notificationStore.showToast('Estado eliminado', 'success')
        } catch(e) {
            console.error(e)
            notificationStore.showToast('Error al eliminar: ' + e.message, 'error')
        }
    }
}

</script>
