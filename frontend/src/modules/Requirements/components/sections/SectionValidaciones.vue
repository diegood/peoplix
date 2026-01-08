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
        Validaciones y Reglas de Negocio
      </label>
      <div class="border border-gray-300 rounded-lg h-64">
        <TiptapEditor
          v-model="form.validations"
          placeholder="Condiciones o reglas que deben cumplirse (Ej: Email único, rol obligatorio)"
          menuType="fixed"
        />
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Salidas / Resultados Esperados
      </label>
      <div class="border border-gray-300 rounded-lg h-64">
        <TiptapEditor
          v-model="form.expectedOutputs"
          placeholder="Qué debe generarse tras ejecutar (Ej: Usuario creado, notificación mostrada, datos guardados en BD)"
          menuType="fixed"
        />
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Mensajes del Sistema / Errores
      </label>
      <div class="border border-gray-300 rounded-lg h-64">
        <TiptapEditor
          v-model="form.systemMessages"
          placeholder="Mensajes a mostrar al usuario (Ej: 'Usuario creado con éxito', 'El email ya está registrado')"
          menuType="fixed"
        />
      </div>
    </div>
  </div>
</template>
