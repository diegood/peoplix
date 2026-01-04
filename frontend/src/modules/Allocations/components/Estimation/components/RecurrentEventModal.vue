<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click="$emit('close')">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" @click.stop>
           <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 class="font-bold text-gray-800">Agregar Evento Recurrente</h3>
               <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                   <X size="20" />
               </button>
           </div>
           
           <div class="p-6 space-y-4">
               <div>
                   <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre del Evento</label>
                   <input v-model="form.name" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Daily Standup" />
               </div>

               <div class="grid grid-cols-2 gap-4">
                   <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Tipo</label>
                       <select v-model="form.type" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                           <option value="DAILY">Diario</option>
                           <option value="WEEKLY">Semanal</option>
                           <option value="MONTHLY">Mensual</option>
                           <option value="SPECIFIC">Específico</option>
                       </select>
                   </div>
                   <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Horas (Penalización)</label>
                       <input v-model.number="form.hours" type="number" step="0.5" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="1.0" />
                   </div>
               </div>

               <div v-if="form.type === 'WEEKLY'">
                   <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Día de la Semana</label>
                   <select v-model.number="form.dayOfWeek" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                       <option :value="1">Lunes</option>
                       <option :value="2">Martes</option>
                       <option :value="3">Miércoles</option>
                       <option :value="4">Jueves</option>
                       <option :value="5">Viernes</option>
                   </select>
               </div>

               <div v-if="form.type === 'MONTHLY'">
                   <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Día del Mes</label>
                   <input v-model.number="form.dayOfMonth" type="number" min="1" max="31" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
               
               <div v-if="form.type === 'SPECIFIC'">
                   <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Fecha Específica</label>
                   <input v-model="form.date" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
               
               <div class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                   <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Desde</label>
                       <input v-model="form.startDate" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                   </div>
                   <div>
                       <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Hasta (Opcional)</label>
                       <input v-model="form.endDate" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                   </div>
               </div>

           </div>
           
           <div class="px-6 py-4 bg-gray-50 flex justify-end gap-2">
               <button @click="$emit('close')" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
               <button @click="handleSave" :disabled="!isValid" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                   Guardar Evento
               </button>
           </div>
      </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { X } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'

const props = defineProps({
  isOpen: Boolean,
  workPackageId: String
})

const emit = defineEmits(['close', 'save'])

const form = reactive({
    name: '',
    type: 'DAILY',
    hours: 1,
    dayOfWeek: 1,
    dayOfMonth: 1,
    date: null,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: null
})

const isValid = computed(() => {
    return form.name && form.hours > 0 && form.startDate
})

const handleSave = () => {
    emit('save', {
        workPackageId: props.workPackageId,
        name: form.name,
        type: form.type,
        hours: form.hours,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        date: form.date || undefined,
        dayOfWeek: form.type === 'WEEKLY' ? form.dayOfWeek : undefined,
        dayOfMonth: form.type === 'MONTHLY' ? form.dayOfMonth : undefined
    })
}
</script>
