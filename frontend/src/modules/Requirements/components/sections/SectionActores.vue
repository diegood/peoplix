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

watch(() => props.form.actors, (v) => scheduleSave('actors', v))
watch(() => props.form.preconditions, (v) => scheduleSave('preconditions', v))
watch(() => props.form.expectedInputs, (v) => scheduleSave('expectedInputs', v))

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

const historyActors = computed(() => extractFieldHistory('actors'))
const historyPreconditions = computed(() => extractFieldHistory('preconditions'))
const historyInputs = computed(() => extractFieldHistory('expectedInputs'))

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
        Actores Involucrados
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.actors"
          placeholder="¿Quién usará esta funcionalidad? (Ej: Administrador, Usuario Final, API externa)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyActors.length"
        :history="historyActors"
        :current-value="form.actors"
        label="Actores"
        :min-height="80"
        @revert="(val) => revertTo('actors', val)"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Condiciones Previas
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.preconditions"
          placeholder="Requisitos o estado previo necesario (Ej: El usuario debe estar autenticado)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyPreconditions.length"
        :history="historyPreconditions"
        :current-value="form.preconditions"
        label="Condiciones Previas"
        :min-height="80"
        @revert="(val) => revertTo('preconditions', val)"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Entradas Esperadas
      </label>
      <div class="border border-gray-300 rounded-lg h-48">
        <TiptapEditor
          v-model="form.expectedInputs"
          placeholder="Datos necesarios (Ej: Nombre de usuario, Email, Rol del usuario)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyInputs.length"
        :history="historyInputs"
        :current-value="form.expectedInputs"
        label="Entradas"
        :min-height="80"
        @revert="(val) => revertTo('expectedInputs', val)"
      />
    </div>
  </div>
</template>
