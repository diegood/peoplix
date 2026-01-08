<script setup>
import { watch, computed } from 'vue'
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'
import FieldHistory from '@/modules/Requirements/components/FieldHistory.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  audit: {
    type: Object,
    default: () => ({})
  },
  history: {
    type: Array,
    default: () => []
  },
  onSaveField: {
    type: Function,
    default: null
  }
})

const debounceMs = 800
const timers = {}
const scheduleSave = (field, value) => {
  if (!props.onSaveField) return
  clearTimeout(timers[field])
  timers[field] = setTimeout(() => props.onSaveField({ [field]: value }), debounceMs)
}

watch(() => props.form.detailedFlow, (v) => scheduleSave('detailedFlow', v))

const extractFieldHistory = (field) => props.history
  .filter(h => h.diff)
  .map(h => {
    try {
      const diff = JSON.parse(h.diff)
      if (diff[field] === undefined) return null
      return { id: h.id, value: diff[field]?.new, who: h.changedBy, when: h.createdAt }
    } catch { return null }
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.when) - new Date(a.when))

const historyFlow = computed(() => extractFieldHistory('detailedFlow'))

const revertTo = (entry) => {
  if (!entry) return
  props.form.detailedFlow = entry.value ?? ''
  props.onSaveField && props.onSaveField({ detailedFlow: props.form.detailedFlow })
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Comportamiento / Flujo Detallado
      </label>
      <p v-if="audit?.detailedFlow" class="text-xs text-gray-500">Último cambio: {{ audit.detailedFlow }}</p>
      <div class="border border-gray-300 rounded-lg h-96">
        <TiptapEditor
          v-model="form.detailedFlow"
          placeholder="Pasos secuenciales del funcionamiento (Ej: 1. El usuario accede... 2. Presiona... 3. El sistema...)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyFlow.length"
        :history="historyFlow"
        :current-value="form.detailedFlow"
        label="Flujo"
        :min-height="120"
        @revert="revertTo"
      />
    </div>
  </div>
</template>
