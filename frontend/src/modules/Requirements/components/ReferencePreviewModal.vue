<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="handleClose"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
      @click.stop
    >
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            RF-{{ data.number }}: {{ data.title }}
          </h3>
          <p class="text-sm text-gray-600">Sección: {{ data.section }}</p>
        </div>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded transition"
        >
          <X size="20" />
        </button>
      </div>
      <div class="px-6 py-4">
        <div class="prose max-w-none" v-html="data.content"></div>
      </div>
      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cerrar
        </button>
        <button
          v-if="canNavigate"
          @click="navigateAndClose"
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <ExternalLink size="16" />
          Ir a la sección
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { X, ExternalLink } from 'lucide-vue-next'

defineProps({
  show: {
    type: Boolean,
    required: true
  },
  data: {
    type: Object,
    required: true,
    validator: (val) => {
      return val && val.number && val.title && val.section && val.content !== undefined
    }
  },
  canNavigate: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'navigate'])

const handleClose = () => {
  emit('close')
}

const navigateAndClose = () => {
  emit('navigate')
  handleClose()
}
</script>
