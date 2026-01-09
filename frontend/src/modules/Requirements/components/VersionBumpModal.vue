<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  currentVersion: {
    type: Object,
    default: () => ({ major: 1, minor: 0, patch: 0 })
  }
})

const emit = defineEmits(['close', 'confirm'])

const selectedBump = ref('patch')

const handleConfirm = () => {
  emit('confirm', selectedBump.value)
}

const getPreviewVersion = (bump) => {
  const { major, minor, patch } = props.currentVersion
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      return `${major}.${minor}.${patch}`
  }
}
</script>

<template>
  <BaseModal :isOpen="show" maxWidth="max-w-lg" @close="emit('close')">
    <template #title>
      Seleccionar tipo de actualización
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Versión actual: <span class="font-semibold">{{ currentVersion.major }}.{{ currentVersion.minor }}.{{ currentVersion.patch }}</span>
      </p>

      <div class="space-y-3">
        <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50" :class="selectedBump === 'patch' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
          <input type="radio" v-model="selectedBump" value="patch" class="mt-1 mr-3" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">Patch ({{ getPreviewVersion('patch') }})</div>
            <div class="text-sm text-gray-600 mt-1">
              Correcciones menores, bugs, o ajustes pequeños que no afectan funcionalidad
            </div>
          </div>
        </label>

        <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50" :class="selectedBump === 'minor' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
          <input type="radio" v-model="selectedBump" value="minor" class="mt-1 mr-3" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">Minor ({{ getPreviewVersion('minor') }})</div>
            <div class="text-sm text-gray-600 mt-1">
              Nueva funcionalidad compatible con versiones anteriores, mejoras incrementales
            </div>
          </div>
        </label>

        <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50" :class="selectedBump === 'major' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
          <input type="radio" v-model="selectedBump" value="major" class="mt-1 mr-3" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">Major ({{ getPreviewVersion('major') }})</div>
            <div class="text-sm text-gray-600 mt-1">
              Cambios significativos en la funcionalidad, rediseño completo o cambios incompatibles
            </div>
          </div>
        </label>
      </div>
    </div>

    <template #footer>
      <button
        @click="emit('close')"
        class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
      >
        Cancelar
      </button>
      <button
        @click="handleConfirm"
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        Actualizar a {{ getPreviewVersion(selectedBump) }}
      </button>
    </template>
  </BaseModal>
</template>
