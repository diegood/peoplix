<template>
  <div v-if="references.length > 0" class="space-y-2">
    <p class="text-sm font-medium text-gray-700">Referencias insertadas:</p>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="(ref, idx) in references"
        :key="idx"
        class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
      >
        <Link2 size="14" class="text-blue-600" />
        <span class="text-blue-900">
          RF-{{ ref.number }}: {{ ref.section }}
        </span>
        <div class="flex items-center gap-1 ml-2">
          <button
            @click="handlePreview(ref)"
            class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded transition"
            title="Ver preview"
          >
            <Eye v-if="!isLoading(ref)" size="14" />
            <svg
              v-else
              class="animate-spin h-4 w-4 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </button>
          <button
            v-if="hasNavigation"
            @click="handleNavigate(ref)"
            class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded transition"
            title="Ir a la sección"
          >
            <ExternalLink size="14" />
          </button>
          <button
            @click="handleRemove(ref)"
            class="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded transition"
            title="Eliminar referencia"
          >
            <X size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { X, Link2, Eye, ExternalLink } from 'lucide-vue-next'

const props = defineProps({
  references: {
    type: Array,
    required: true
  },
  loadingRef: {
    type: Object,
    default: null
  },
  hasNavigation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['preview', 'navigate', 'remove'])

const isLoading = (ref) => {
  return props.loadingRef?.id === ref.id
}

const handlePreview = (ref) => {
  emit('preview', ref)
}

const handleNavigate = (ref) => {
  emit('navigate', ref)
}

const handleRemove = (ref) => {
  emit('remove', ref)
}
</script>
