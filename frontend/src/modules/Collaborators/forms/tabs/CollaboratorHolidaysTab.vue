<script setup>
import { ref, computed } from 'vue'
import { Calendar, AlertCircle, Building2 } from 'lucide-vue-next'

const props = defineProps({
  workCenter: { type: Object, default: () => null },
  collaboratorId: { type: String, required: true }
})

const selectedYear = ref(new Date().getFullYear())

const holidays = computed(() => {
    if (!props.workCenter?.publicHolidayCalendars) return []
    const calendar = props.workCenter.publicHolidayCalendars.find(c => c.year === selectedYear.value)
    return calendar?.holidays || []
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                    <Building2 class="text-indigo-500" size="20"/>
                    <div>
                        <h3 class="font-bold text-gray-700">Festivos de Centro de Trabajo</h3>
                        <p class="text-xs text-gray-500" v-if="workCenter">
                            {{ workCenter.name }} ({{ workCenter.countryCode }}{{ workCenter.regionCode ? '-' + workCenter.regionCode : '' }})
                        </p>
                        <p class="text-xs text-red-400 italic" v-else>Sin centro de trabajo asignado</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">Año:</span>
                    <input v-model.number="selectedYear" type="number" class="w-20 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                </div>
            </div>
            
            <div class="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
                <AlertCircle size="14" class="mt-0.5" />
                <p>
                    Los días festivos son gestionados automáticamente según el centro de trabajo asignado. 
                    No es posible editar festivos individuales.
                </p>
            </div>

            <div class="flex-1 overflow-y-auto border rounded-lg p-3 min-h-[200px] bg-gray-50">
                <div v-if="holidays.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div v-for="h in holidays" :key="h.date" 
                            class="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-md flex items-center gap-2 shadow-sm">
                            <Calendar size="14" class="text-blue-400 shrink-0"/>
                            <div class="truncate">
                                <div class="font-bold">{{ formatDate(h.date) }}</div>
                                <div class="text-[10px] text-gray-500 truncate" :title="h.name || h.localName">{{ h.name || h.localName }}</div>
                            </div>
                    </div>
                </div>
                <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 italic text-xs py-8 gap-2">
                    <Calendar size="24" class="opacity-20"/>
                    <p>No hay festivos definidos para este año en este centro.</p>
                </div>
            </div>
        </div>
    </div>
</template>
