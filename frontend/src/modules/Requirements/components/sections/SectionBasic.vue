<script setup>
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Título de la Funcionalidad *
      </label>
      <input
        v-model="form.title"
        type="text"
        placeholder="Ej: Gestión de Usuarios"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
      />
      <p class="text-xs text-gray-500 mt-2">Breve y clara descripción de la funcionalidad</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Descripción Breve *
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.description"
          placeholder="Explica brevemente qué hace esta funcionalidad"
          menuType="fixed"
        />
      </div>
    </div>

    <div v-if="isEditing" class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Estado
      </label>
      <select
        v-model="form.status"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="DRAFT">Borrador</option>
        <option value="PENDING_REVIEW">Pendiente de Revisión</option>
        <option value="VALIDATED">Validado</option>
        <option value="DEPRECATED">Deprecado</option>
      </select>
    </div>
  </div>
</template>
