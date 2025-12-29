<script setup>
import { X, Calendar } from 'lucide-vue-next'
import VacationGantt from './VacationGantt.vue'

defineProps({
  isOpen: Boolean,
  project: Object
})

const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Calendar size="20" />
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-800">Vacaciones: {{ project?.name }}</h2>
                <p class="text-xs text-gray-500">Visualización de ausencias del equipo</p>
            </div>
        </div>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors">
          <X size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-auto p-6 bg-white">
          <VacationGantt v-if="project" :project="project" />
      </div>
    
    </div>
  </div>
</template>
