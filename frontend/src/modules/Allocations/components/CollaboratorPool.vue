<script setup>
import draggable from 'vuedraggable'

const props = defineProps({
    collaborators: { type: Array, default: () => [] },
    loading: Boolean,
    selectedWeek: String
})

const emit = defineEmits(['drag-start', 'drag-end'])

const getOccupation = (collab) => {
    if (!collab.allocations) return 0
    return collab.allocations.reduce((acc, alloc) => {
        const isActive = alloc.startWeek <= props.selectedWeek && (!alloc.endWeek || alloc.endWeek >= props.selectedWeek)
        return isActive ? acc + (alloc.dedicationPercentage || 0) : acc
    }, 0)
}
</script>

<template>
    <div class="bg-white p-4 border-b border-gray-200 shadow-sm relative z-10">
      <h3 class="font-bold text-gray-700 mb-2">Colaboradores (Arrastrar para asignar en {{selectedWeek}})</h3>
      <div v-if="loading">Cargando...</div>
      <draggable 
        v-else
        :list="collaborators" 
        :group="{ name: 'people', pull: 'clone', put: false }" 
        item-key="id"
        @start="emit('drag-start')" 
        @end="emit('drag-end')"
        class="flex gap-3 overflow-x-auto pb-2"
      >
        <template #item="{ element }">
          <div class="flex-shrink-0 w-48 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow select-none">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                 {{ (element.firstName || '?').charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-sm truncate" :title="`${element.firstName} ${element.lastName}`">{{ element.firstName }} {{ element.lastName }}</div>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-gray-400">{{ element.contractedHours }} hrs</span>
                    <span :class="['text-[10px] px-1.5 py-0.5 rounded font-bold border', 
                        getOccupation(element) >= 100 ? 'bg-red-50 text-red-600 border-red-100' : 
                        getOccupation(element) > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100']">
                        {{ getOccupation(element) }}%
                    </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
</template>
