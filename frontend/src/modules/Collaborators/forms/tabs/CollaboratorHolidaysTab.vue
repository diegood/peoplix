<script setup>
import { ref, onMounted } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
  UPDATE_HOLIDAY_CALENDAR 
} from '@/modules/Collaborators/graphql/collaborator.queries'
import { Calendar, AlertCircle, X } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  collaboratorId: { type: String, required: true },
  holidayCalendar: { type: Object, default: () => null }
})

const emit = defineEmits(['update:holidayCalendar'])
const notificationStore = useNotificationStore()

// State
const form = ref({ year: new Date().getFullYear(), holidays: [] })
const newHolidayDate = ref('')

// Initialize from props
onMounted(() => {
    initForm()
})

const initForm = () => {
    form.value = {
        year: props.holidayCalendar?.year || new Date().getFullYear(),
        holidays: [...(props.holidayCalendar?.holidays || [])]
    }
}

// Mutations
const { mutate: updateHolidayCalendar } = useMutation(UPDATE_HOLIDAY_CALENDAR)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES')
}

const addHolidayDate = () => {
  if (newHolidayDate.value && !form.value.holidays.includes(newHolidayDate.value)) {
    form.value.holidays.push(newHolidayDate.value)
    form.value.holidays.sort()
    newHolidayDate.value = ''
  }
}
const removeHolidayDate = (date) => {
  form.value.holidays = form.value.holidays.filter(d => d !== date)
}

const onSaveHolidays = async () => {
  try {
    const res = await updateHolidayCalendar({
      collaboratorId: props.collaboratorId,
      year: Number(form.value.year),
      holidays: form.value.holidays
    })
    
    if (res?.data?.updateHolidayCalendar) {
        emit('update:holidayCalendar', res.data.updateHolidayCalendar)
    }

    notificationStore.showToast('Calendario actualizado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message, 'error')
  }
}
</script>

<template>
    <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700">Calendario de Festivos Personales</h3>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">Año:</span>
                    <input v-model="form.year" type="number" class="w-20 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all !py-1" />
                </div>
            </div>
            
            <div class="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
                <AlertCircle size="14" class="mt-0.5" />
                <p>Estos días se restarán automáticamente de la capacidad del colaborador para las asignaciones.</p>
            </div>

            <div class="flex gap-2 mb-4">
                <input v-model="newHolidayDate" type="date" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all flex-1" />
                <button @click="addHolidayDate" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">Agregar Fecha</button>
            </div>
            
            <div class="flex-1 overflow-y-auto border rounded-lg p-2 min-h-[200px] bg-gray-50">
                <div class="flex flex-wrap gap-2">
                    <div v-for="date in form.holidays" :key="date" 
                            class="bg-white border border-blue-100 text-blue-700 text-xs px-2 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                            <Calendar size="12" class="text-blue-400"/>
                            {{ formatDate(date) }}
                            <button @click="removeHolidayDate(date)" class="text-blue-300 hover:text-red-500">
                                <X size="12" />
                            </button>
                    </div>
                    <span v-if="!form.holidays.length" class="text-gray-400 italic text-xs w-full text-center py-4">
                        No hay fechas seleccionadas para este año.
                    </span>
                </div>
            </div>

            <div class="mt-4 flex justify-end">
                <button @click="onSaveHolidays" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow">
                    Guardar Calendario
                </button>
            </div>
        </div>
    </div>
</template>
