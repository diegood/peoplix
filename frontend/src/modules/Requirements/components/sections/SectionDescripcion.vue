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
        Descripción General
      </label>
      <div class="border border-gray-300 rounded-lg h-96">
        <TiptapEditor
          v-model="form.generalDescription"
          placeholder="Explica en detalle qué hace la funcionalidad y su propósito en el sistema"
          menuType="fixed"
        />
      </div>
    </div>
  </div>
</template>
