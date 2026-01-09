<script setup>
import { watch, computed } from 'vue'
import EditorWithReferences from '@/modules/Requirements/components/EditorWithReferences.vue'
import FieldHistory from '@/modules/Requirements/components/FieldHistory.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
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

watch(() => props.form.title, (v) => scheduleSave('title', v))
watch(() => props.form.description, (v) => scheduleSave('description', v))
watch(() => props.form.status, (v) => scheduleSave('status', v))

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

const historyTitle = computed(() => extractFieldHistory('title'))
const historyDescription = computed(() => extractFieldHistory('description'))
const historyStatus = computed(() => extractFieldHistory('status'))

const revertTo = (field, entry) => {
  if (!entry) return
  props.form[field] = entry.value ?? ''
  props.onSaveField && props.onSaveField({ [field]: props.form[field] })
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Título de la Funcionalidad *
          </label>
        </div>
        <input
          v-model="form.title"
          type="text"
          placeholder="Ej: Gestión de Usuarios"
          class="w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        <p class="text-xs text-gray-500 mt-1">Breve y clara descripción de la funcionalidad</p>

        <FieldHistory
          v-if="historyTitle.length"
          :history="historyTitle"
          :current-value="form.title"
          label="Título"
          @revert="(val) => revertTo('title', val)"
        />
      </div>

    <div class="bg-white p-6 rounded-lg shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Descripción Breve *
          </label>
        </div>
        <div class="border-gray-300 rounded-lg">
          <EditorWithReferences
            v-model="form.description"
            :projectId="projectId"
            :currentRequirementId="requirementId"
            :orgTag="orgTag"
            :projectTag="projectTag"
            placeholder="Explica brevemente qué hace esta funcionalidad"
            menuType="fixed"
          />
        </div>

        <FieldHistory
          v-if="historyDescription.length"
          :history="historyDescription"
          :current-value="form.description"
          label="Descripción"
          :min-height="80"
          @revert="(val) => revertTo('description', val)"
        />
      </div>

    <div v-if="isEditing" class="bg-white p-6 rounded-lg shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">
            Estado
          </label>
        </div>
        <select
          v-model="form.status"
          class="w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="DRAFT">Borrador</option>
          <option value="PENDING_REVIEW">Pendiente de Revisión</option>
          <option value="VALIDATED">Validado</option>
          <option value="DEPRECATED">Deprecado</option>
          <option value="BLOCKED">Bloqueado</option>
        </select>

        <FieldHistory
          v-if="historyStatus.length"
          :history="historyStatus"
          :current-value="form.status"
          label="Estado"
          :min-height="60"
          @revert="(val) => revertTo('status', val)"
        />
      </div>
  </div>
</template>
