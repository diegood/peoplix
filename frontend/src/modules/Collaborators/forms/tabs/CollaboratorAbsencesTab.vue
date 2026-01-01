<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
    GET_ABSENCES, 
    REQUEST_ABSENCE, 
    DELETE_ABSENCE,
    GET_ABSENCE_TYPES 
} from '@/modules/Absences/graphql/absence.queries.js'
import { Plus, Check } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
    collaboratorId: { type: String, required: true },
    workCenter: { type: Object, default: null },
    vacationDaysPerYear: { type: Object, default: () => ({}) }
})

const notificationStore = useNotificationStore()

const isCreating = ref(false)
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const form = ref({
    typeId: '',
    startDate: '',
    endDate: '',
    reason: ''
})

const { result: absencesResult, refetch: refetchAbsences, loading: loadingAbsences } = useQuery(GET_ABSENCES, () => ({
    collaboratorId: props.collaboratorId
}))

const { result: typesResult } = useQuery(GET_ABSENCE_TYPES)

const { mutate: requestAbsence, loading: requesting } = useMutation(REQUEST_ABSENCE)
const { mutate: deleteAbsence } = useMutation(DELETE_ABSENCE)

const absences = computed(() => absencesResult.value?.absences || [])
const types = computed(() => typesResult.value?.absenceTypes || [])

const vacationBalance = computed(() => {
    const allowance = props.vacationDaysPerYear && props.vacationDaysPerYear[selectedYear.value] 
        ? Number(props.vacationDaysPerYear[selectedYear.value]) 
        : 23
    
    const consumed = absences.value
        .filter(a => {
            const d = new Date(a.startDate)
            return d.getFullYear() === selectedYear.value && a.type.isVacation
        })
        .reduce((sum, a) => sum + (a.daysConsumed || 0), 0)
        
    return {
        allowance,
        consumed,
        remaining: allowance - consumed
    }
})

const startRequest = () => {
    form.value = {
        typeId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    }
    isCreating.value = true
}

const cancelRequest = () => {
    isCreating.value = false
}

const submitRequest = async () => {
    try {
        if (!form.value.typeId || !form.value.startDate || !form.value.endDate) {
            notificationStore.showToast('Completa todos los campos obligatorios', 'error')
            return
        }
        
        if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
            notificationStore.showToast('La fecha fin debe ser posterior a la fecha inicio', 'error')
            return
        }

        await requestAbsence({
            collaboratorId: props.collaboratorId,
            typeId: form.value.typeId,
            startDate: form.value.startDate,
            endDate: form.value.endDate,
            reason: form.value.reason
        })
        
        notificationStore.showToast('Ausencia solicitada correctamente', 'success')
        await refetchAbsences()
        isCreating.value = false
    } catch (err) {
        notificationStore.showToast(err.message || 'Error al solicitar ausencia', 'error')
    }
}

const removeAbsence = async (id) => {
    if (!await notificationStore.showDialog('¿Eliminar esta ausencia?', 'Eliminar Ausencia')) return
    try {
        await deleteAbsence({ id })
        notificationStore.showToast('Ausencia eliminada', 'success')
        await refetchAbsences()
    } catch {
        notificationStore.showToast('Error al eliminar ausencia', 'error')
    }
}

const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}
</script>

<template>
    <div class="h-full flex flex-col gap-4">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
            <div>
                <h4 class="font-bold text-blue-900">Saldo de Vacaciones {{ selectedYear }}</h4>
                <div class="flex gap-4 mt-1 text-sm text-blue-800">
                    <div>Asignadas: <span class="font-bold">{{ vacationBalance.allowance }}</span></div>
                    <div>Consumidas: <span class="font-bold">{{ vacationBalance.consumed }}</span></div>
                    <div>Restantes: <span class="font-bold text-lg" :class="vacationBalance.remaining < 0 ? 'text-red-600' : 'text-green-600'">{{ vacationBalance.remaining }}</span></div>
                </div>
            </div>
             <div class="flex items-center gap-2">
                <select v-model="selectedYear" class="border rounded px-2 py-1 text-sm bg-white">
                    <option :value="currentYear - 1">{{ currentYear - 1 }}</option>
                    <option :value="currentYear">{{ currentYear }}</option>
                    <option :value="currentYear + 1">{{ currentYear + 1 }}</option>
                </select>
                <button @click="startRequest" v-if="!isCreating" class="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Plus size="16"/> Solicitar Ausencia
                </button>
            </div>
        </div>

        <div v-if="isCreating" class="bg-white p-4 rounded-lg border shadow-sm">
            <h4 class="font-bold text-gray-700 mb-3">Nueva Solicitud</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Motivo / Tipo</label>
                    <select v-model="form.typeId" class="w-full border rounded-md p-2 text-sm">
                        <option value="" disabled>Selecciona un motivo...</option>
                        <option v-for="t in types" :key="t.id" :value="t.id">
                            {{ t.name }} {{ t.isVacation ? '(Vacaciones)' : '' }}
                        </option>
                    </select>
                </div>
                <div>
                     <label class="block text-xs font-medium text-gray-500 mb-1">Descripción (Opcional)</label>
                     <input v-model="form.reason" type="text" class="w-full border rounded-md p-2 text-sm" placeholder="Detalles adicionales..."/>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                    <input v-model="form.startDate" type="date" class="w-full border rounded-md p-2 text-sm"/>
                </div>
                 <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Hasta (inclusive)</label>
                    <input v-model="form.endDate" type="date" class="w-full border rounded-md p-2 text-sm"/>
                </div>
            </div>
             <div class="flex justify-end gap-2 mt-4">
                <button @click="cancelRequest" class="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">Cancelar</button>
                <button @click="submitRequest" :disabled="requesting" class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2">
                    <Check size="16"/> {{ requesting ? 'Enviando...' : 'Solicitar' }}
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-white rounded-lg border">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                        <th class="p-3">Tipo</th>
                        <th class="p-3">Fechas</th>
                        <th class="p-3">Días</th>
                        <th class="p-3">Estado</th>
                        <th class="p-3">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                     <tr v-if="loadingAbsences">
                        <td colspan="5" class="p-4 text-center text-gray-500">Cargando...</td>
                    </tr>
                    <tr v-else-if="!absences.length">
                        <td colspan="5" class="p-8 text-center text-gray-400 italic">No hay ausencias registradas.</td>
                    </tr>
                    <tr v-for="abs in absences" :key="abs.id" class="hover:bg-gray-50">
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-medium" :style="{ backgroundColor: abs.type.color + '20', color: abs.type.color }">
                                {{ abs.type.name }}
                            </span>
                            <div v-if="abs.reason" class="text-xs text-gray-500 mt-1">{{ abs.reason }}</div>
                        </td>
                        <td class="p-3">
                            <div>{{ formatDate(abs.startDate) }}</div>
                            <div class="text-xs text-gray-400">a</div>
                            <div>{{ formatDate(abs.endDate) }}</div>
                        </td>
                        <td class="p-3 font-medium">
                            {{ abs.daysConsumed }}
                        </td>
                        <td class="p-3">
                            <span :class="{
                                'text-green-600 bg-green-50': abs.status === 'APPROVED',
                                'text-yellow-600 bg-yellow-50': abs.status === 'PENDING',
                                'text-red-600 bg-red-50': abs.status === 'REJECTED'
                            }" class="px-2 py-0.5 rounded text-xs select-none">
                                {{ abs.status === 'APPROVED' ? 'Aprobado' : (abs.status === 'PENDING' ? 'Pendiente' : 'Rechazado') }}
                            </span>
                        </td>
                        <td class="p-3">
                            <button @click="removeAbsence(abs.id)" class="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                <Trash size="16"/>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
