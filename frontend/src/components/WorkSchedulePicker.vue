<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const days = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

const schedule = reactive({})

const initializeSchedule = () => {
  days.forEach(day => {
    if (props.modelValue && props.modelValue[day.key]) {
      schedule[day.key] = { ...props.modelValue[day.key] }
    } else {
      const isWeekend = day.key === 'saturday' || day.key === 'sunday'
      schedule[day.key] = {
        active: !isWeekend,
        start: '09:00',
        end: '18:00'
      }
    }
  })
}

watch(() => props.modelValue, (newVal) => {
    if (JSON.stringify(newVal) === JSON.stringify(schedule)) return
    initializeSchedule()
}, { deep: true, immediate: true })

watch(schedule, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Día</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Laborable</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="day in days" :key="day.key" :class="{ 'bg-gray-50': !schedule[day.key]?.active }">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {{ day.label }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
             <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="schedule[day.key].active" :disabled="disabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
             </label>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <input 
              type="time" 
              v-model="schedule[day.key].start" 
              :disabled="disabled || !schedule[day.key].active"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
            >
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <input 
              type="time" 
              v-model="schedule[day.key].end" 
              :disabled="disabled || !schedule[day.key].active"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
