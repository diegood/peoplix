<script setup>
import draggable from 'vuedraggable'

const props = defineProps({
    collaborators: { type: Array, default: () => [] },
    loading: Boolean,
    selectedWeek: String
})

const emit = defineEmits(['drag-start', 'drag-end'])
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
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                 {{ (element.firstName || element.name || '?').charAt(0) }}
              </div>
              <div>
                <div class="font-semibold text-sm truncate">{{ element.firstName || element.name }} {{ element.lastName }}</div>
                <div class="text-xs text-gray-400">{{ element.contractedHours }} hrs</div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
</template>
