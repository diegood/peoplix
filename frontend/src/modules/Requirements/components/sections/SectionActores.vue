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
        Actores Involucrados
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.actors"
          placeholder="¿Quién usará esta funcionalidad? (Ej: Administrador, Usuario Final, API externa)"
          menuType="fixed"
        />
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Condiciones Previas
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.preconditions"
          placeholder="Requisitos o estado previo necesario (Ej: El usuario debe estar autenticado)"
          menuType="fixed"
        />
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Entradas Esperadas
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.expectedInputs"
          placeholder="Datos necesarios (Ej: Nombre de usuario, Email, Rol del usuario)"
          menuType="fixed"
        />
      </div>
    </div>
  </div>
</template>
