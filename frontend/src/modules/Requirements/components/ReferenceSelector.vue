<template>
  <div class="space-y-3">
    <div class="space-y-2">
      <label class="text-sm font-medium text-gray-700">Selecciona la sección:</label>
      <select
        v-model="selectedSection"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="">-- Selecciona sección --</option>
        <option v-for="section in sections" :key="section.id" :value="section.id">
          {{ section.label }}
        </option>
      </select>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium text-gray-700">Selecciona el requisito:</label>
      <div class="max-h-48 overflow-y-auto space-y-1">
        <button
          v-if="availableRequirements.length === 0"
          disabled
          class="w-full text-left px-3 py-2 text-gray-500 text-sm"
        >
          Sin requisitos disponibles
        </button>
        <button
          v-for="req in availableRequirements"
          :key="req.id"
          @click="handleSelect(req)"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm border border-transparent hover:border-blue-300"
        >
          <span class="font-medium text-gray-900">RF-{{ req.number }}</span>
          <span class="text-gray-600">{{ req.title }}</span>
        </button>
      </div>
    </div>

    <button
      @click="handleCancel"
      class="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
    >
      Cancelar
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  availableRequirements: {
    type: Array,
    required: true
  },
  sections: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select', 'cancel'])

const selectedSection = ref('')

const handleSelect = (requirement) => {
  if (!selectedSection.value) {
    alert('Selecciona una sección')
    return
  }

  const sectionLabel = props.sections.find(s => s.id === selectedSection.value)?.label || selectedSection.value
  
  emit('select', {
    requirement,
    sectionId: selectedSection.value,
    sectionLabel
  })

  selectedSection.value = ''
}

const handleCancel = () => {
  selectedSection.value = ''
  emit('cancel')
}
</script>
