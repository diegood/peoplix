<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
    GET_ABSENCE_TYPES, 
    CREATE_ABSENCE_TYPE, 
    UPDATE_ABSENCE_TYPE, 
    DELETE_ABSENCE_TYPE 
} from '@/modules/Absences/graphql/absence.queries.js'
import { Plus } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const { result, loading, refetch } = useQuery(GET_ABSENCE_TYPES)

const { mutate: createType } = useMutation(CREATE_ABSENCE_TYPE)
const { mutate: updateType } = useMutation(UPDATE_ABSENCE_TYPE)
const { mutate: deleteType } = useMutation(DELETE_ABSENCE_TYPE)

const isCreating = ref(false)
const editingId = ref(null)
const form = ref({
    name: '',
    color: '#3B82F6',
    isPaid: true,
    requiresApproval: false,
    isVacation: false
})

const resetForm = () => {
    form.value = { name: '', color: '#3B82F6', isPaid: true, requiresApproval: false, isVacation: false }
    isCreating.value = false
    editingId.value = null
}

const startCreate = () => {
    resetForm()
    isCreating.value = true
}

const startEdit = (type) => {
    form.value = { ...type }
    editingId.value = type.id
    isCreating.value = false
}

const onSave = async () => {
    try {
        if (editingId.value) {
            await updateType({
                id: editingId.value,
                ...form.value
            })
            notificationStore.showToast('Tipo de ausencia actualizado', 'success')
        } else {
            await createType(form.value)
            notificationStore.showToast('Tipo de ausencia creado', 'success')
        }
        await refetch()
        resetForm()
    } catch {
        notificationStore.showToast('Error al guardar', 'error')
    }
}

const onDelete = async (id) => {
    const confirmed = await notificationStore.showDialog('¿Seguro que deseas eliminar este tipo de ausencia?', 'Eliminar Ausencia')
    if (!confirmed) return
    try {
        await deleteType({ id })
        notificationStore.showToast('Eliminado correctamente', 'success')
        await refetch()
    } catch {
         notificationStore.showToast('No se puede eliminar (posiblemente en uso)', 'error')
    }
}
</script>

<template>
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarOff class="text-red-500"/> Tipos de Ausencia / Motivos
            </h3>
            <button v-if="!isCreating && !editingId" @click="startCreate" class="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-blue-700">
                <Plus size="16"/> Nuevo Motivo
            </button>
        </div>

        <div v-if="!isCreating && !editingId" class="space-y-2">
            <div v-if="loading" class="text-center py-4 text-gray-500">Cargando...</div>
            <div v-else-if="!result?.absenceTypes?.length" class="text-center py-8 bg-gray-50 rounded text-gray-500 italic">
                No hay motivos de ausencia definidos.
            </div>
            <div v-for="type in result?.absenceTypes" :key="type.id" class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: type.color }"></div>
                    <div>
                        <div class="font-medium text-gray-800">{{ type.name }}</div>
                        <div class="text-xs text-gray-500 flex gap-2">
                            <span v-if="type.isVacation" class="text-green-600 font-semibold">Cuenta como Vacaciones</span>
                            <span v-if="type.isPaid">Remunerado</span>
                            <span v-if="!type.isPaid" class="text-red-500">No Remunerado</span>
                            <span v-if="type.requiresApproval">Requiere Aprobación</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="startEdit(type)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size="16"/></button>
                    <button @click="onDelete(type.id)" class="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash size="16"/></button>
                </div>
            </div>
        </div>

        <div v-else class="bg-gray-50 p-4 rounded-lg border border-blue-100">
            <h4 class="font-bold text-gray-700 mb-3">{{ isCreating ? 'Nuevo Motivo' : 'Editar Motivo' }}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-medium text-gray-500 uppercase">Nombre</label>
                    <input v-model="form.name" type="text" class="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 uppercase">Color</label>
                    <input v-model="form.color" type="color" class="w-full mt-1 h-9 p-1 border rounded-md cursor-pointer"/>
                </div>
                <div class="md:col-span-2 flex flex-wrap gap-4 mt-2">
                    <label class="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 border rounded hover:bg-gray-100">
                        <input type="checkbox" v-model="form.isVacation" class="form-checkbox text-blue-600 rounded"/>
                        <span class="text-sm">Es Vacaciones (Descuenta Saldo)</span>
                    </label>
                     <label class="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 border rounded hover:bg-gray-100">
                        <input type="checkbox" v-model="form.isPaid" class="form-checkbox text-blue-600 rounded"/>
                        <span class="text-sm">Remunerado</span>
                    </label>
                     <label class="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 border rounded hover:bg-gray-100">
                        <input type="checkbox" v-model="form.requiresApproval" class="form-checkbox text-blue-600 rounded"/>
                        <span class="text-sm">Requiere Aprobación</span>
                    </label>
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <button @click="resetForm" class="px-3 py-2 bg-white border text-gray-600 rounded-md text-sm hover:bg-gray-100">Cancelar</button>
                <button @click="onSave" class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Check size="16"/> Guardar
                </button>
            </div>
        </div>
    </div>
</template>
