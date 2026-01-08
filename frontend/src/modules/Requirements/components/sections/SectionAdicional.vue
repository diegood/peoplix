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
        URL del Mockup / Diseño
      </label>
      <input
        v-model="form.mockupUrl"
        type="url"
        placeholder="https://..."
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Notas Adicionales
      </label>
      <div class="border border-gray-300 rounded-lg h-64">
        <TiptapEditor
          v-model="form.notes"
          placeholder="Aclaraciones para evitar suposiciones o malentendidos"
          menuType="fixed"
        />
      </div>
    </div>
  </div>
</template>
