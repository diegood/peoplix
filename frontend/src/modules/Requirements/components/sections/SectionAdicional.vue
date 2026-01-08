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

watch(() => props.form.mockupUrl, (v) => scheduleSave('mockupUrl', v))
watch(() => props.form.notes, (v) => scheduleSave('notes', v))

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

const historyMockup = computed(() => extractFieldHistory('mockupUrl'))
const historyNotes = computed(() => extractFieldHistory('notes'))

const revertTo = (field, entry) => {
  if (!entry) return
  props.form[field] = entry.value ?? ''
  props.onSaveField && props.onSaveField({ [field]: props.form[field] })
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        URL del Mockup / Diseño
      </label>
      <p v-if="audit?.mockupUrl" class="text-xs text-gray-500">Último cambio: {{ audit.mockupUrl }}</p>
      <input
        v-model="form.mockupUrl"
        type="url"
        placeholder="https://..."
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <FieldHistory
        v-if="historyMockup.length"
        :history="historyMockup"
        :current-value="form.mockupUrl"
        label="Mockup"
        :min-height="40"
        @revert="(val) => revertTo('mockupUrl', val)"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Notas Adicionales
      </label>
      <p v-if="audit?.notes" class="text-xs text-gray-500">Último cambio: {{ audit.notes }}</p>
      <div class="border border-gray-300 rounded-lg h-64">
        <TiptapEditor
          v-model="form.notes"
          placeholder="Aclaraciones para evitar suposiciones o malentendidos"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyNotes.length"
        :history="historyNotes"
        :current-value="form.notes"
        label="Notas"
        :min-height="100"
        @revert="(val) => revertTo('notes', val)"
      />
    </div>
  </div>
</template>
