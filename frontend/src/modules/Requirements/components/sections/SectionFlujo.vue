<script setup>
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Comportamiento / Flujo Detallado
      </label>
      <div class="border border-gray-300 rounded-lg h-96">
        <TiptapEditor
          v-model="form.detailedFlow"
          placeholder="Pasos secuenciales del funcionamiento (Ej: 1. El usuario accede... 2. Presiona... 3. El sistema...)"
          menuType="fixed"
        />
      </div>
    </div>
  </div>
</template>
