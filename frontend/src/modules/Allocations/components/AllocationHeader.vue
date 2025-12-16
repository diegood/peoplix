<script setup>
import { Calendar, Settings2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  viewMode: String,
  zoomLevel: String,
  selectedWeek: String,
  monthlyRange: Object
})

const emit = defineEmits([
  'update:viewMode', 
  'update:zoomLevel', 
  'update:selectedWeek',
  'update:monthlyRange',
  'navigate',
  'open-manager'
])

const localSelectedWeek = computed({
    get: () => props.selectedWeek,
    set: (val) => emit('update:selectedWeek', val)
})

const localMonthlyStart = computed({
    get: () => props.monthlyRange.start,
    set: (val) => emit('update:monthlyRange', { ...props.monthlyRange, start: val })
})

const localMonthlyEnd = computed({
    get: () => props.monthlyRange.end,
    set: (val) => emit('update:monthlyRange', { ...props.monthlyRange, end: val })
})
</script>

<template>
    <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
                 <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar class="text-blue-600" />
                    Planificación
                </h2>
                <div class="flex bg-gray-100 p-1 rounded-lg">
                    <button @click="emit('update:viewMode', 'weekly')" 
                            class="px-3 py-1 text-sm rounded-md transition-all"
                            :class="viewMode === 'weekly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Semanal
                    </button>
                    <button @click="emit('update:viewMode', 'monthly')" 
                            class="px-3 py-1 text-sm rounded-md transition-all"
                            :class="viewMode === 'monthly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Mensual
                    </button>
                </div>
            </div>

            <slot name="summary" />
            
        </div>

        <div class="flex items-center gap-3">
            <template v-if="viewMode === 'weekly'">
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center" @click="emit('navigate', 'prev')">
                    <ChevronLeft size="16" />
                </button>
                 <input type="week" v-model="localSelectedWeek" class="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center" @click="emit('navigate', 'next')">
                    <ChevronRight size="16" />
                </button>
            </template>
             <template v-else>
                 <div class="flex items-center gap-2 text-sm">
                     <span class="text-gray-500">Desde:</span>
                     <input type="month" v-model="localMonthlyStart" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500" />
                     <span class="text-gray-500">Hasta:</span>
                     <input type="month" v-model="localMonthlyEnd" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500" />
                     
                     <div class="h-6 w-px bg-gray-300 mx-2"></div>
                     
                     <button @click="emit('open-manager')" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition">
                        <Settings2 size="14" />
                        Gestionar Hitos
                     </button>
                     
                     <div class="flex bg-gray-100 p-0.5 rounded-lg ml-2">
                        <button @click="emit('update:zoomLevel', 'month')" 
                                class="px-2 py-0.5 text-xs rounded transition-all"
                                :class="zoomLevel === 'month' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                            Mes
                        </button>
                        <button @click="emit('update:zoomLevel', 'day')" 
                                class="px-2 py-0.5 text-xs rounded transition-all"
                                :class="zoomLevel === 'day' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                            Día
                        </button>
                    </div>
                 </div>
            </template>
        </div>
    </div>
</template>
