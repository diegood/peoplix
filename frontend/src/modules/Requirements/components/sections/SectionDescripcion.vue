<script setup>
import { watch, computed } from 'vue'
import EditorWithReferences from '@/modules/Requirements/components/EditorWithReferences.vue'
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
  },
  projectId: {
    type: String,
    default: null
  },
  requirementId: {
    type: String,
    default: null
  },
  orgTag: {
    type: String,
    default: null
  },
  projectTag: {
    type: String,
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

watch(() => props.form.generalDescription, (v) => scheduleSave('generalDescription', v))

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

const historyGeneral = computed(() => extractFieldHistory('generalDescription'))

const revertTo = (entry) => {
  if (!entry) return
  props.form.generalDescription = entry.value ?? ''
  props.onSaveField && props.onSaveField({ generalDescription: props.form.generalDescription })
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Descripción General
      </label>
      <p v-if="audit?.generalDescription" class="text-xs text-gray-500">Último cambio: {{ audit.generalDescription }}</p>
      <div class="border border-gray-300 rounded-lg">
        <EditorWithReferences
          v-model="form.generalDescription"
          :projectId="projectId"
          :currentRequirementId="requirementId"          :orgTag="orgTag"
          :projectTag="projectTag"          placeholder="Explica en detalle qué hace la funcionalidad y su propósito en el sistema"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyGeneral.length"
        :history="historyGeneral"
        :current-value="form.generalDescription"
        label="Descripción General"
        :min-height="120"
        @revert="revertTo"
      />
    </div>
  </div>
</template>
