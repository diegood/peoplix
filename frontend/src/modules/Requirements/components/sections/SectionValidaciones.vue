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

watch(() => props.form.validations, (v) => scheduleSave('validations', v))
watch(() => props.form.expectedOutputs, (v) => scheduleSave('expectedOutputs', v))
watch(() => props.form.systemMessages, (v) => scheduleSave('systemMessages', v))

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

const historyValidations = computed(() => extractFieldHistory('validations'))
const historyOutputs = computed(() => extractFieldHistory('expectedOutputs'))
const historyMessages = computed(() => extractFieldHistory('systemMessages'))

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
        Validaciones y Reglas de Negocio
      </label>
      <p v-if="audit?.validations" class="text-xs text-gray-500">Último cambio: {{ audit.validations }}</p>
      <div class="border border-gray-300 rounded-lg">
        <EditorWithReferences
          v-model="form.validations"
          :projectId="projectId"
          :currentRequirementId="requirementId"
          :orgTag="orgTag"
          :projectTag="projectTag"
          placeholder="Condiciones o reglas que deben cumplirse (Ej: Email único, rol obligatorio)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyValidations.length"
        :history="historyValidations"
        :current-value="form.validations"
        label="Validaciones"
        :min-height="100"
        @revert="(val) => revertTo('validations', val)"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Salidas / Resultados Esperados
      </label>
      <p v-if="audit?.expectedOutputs" class="text-xs text-gray-500">Último cambio: {{ audit.expectedOutputs }}</p>
      <div class="border border-gray-300 rounded-lg">
        <EditorWithReferences
          v-model="form.expectedOutputs"
          :projectId="projectId"
          :currentRequirementId="requirementId"
          :orgTag="orgTag"
          :projectTag="projectTag"
          placeholder="Qué debe generarse tras ejecutar (Ej: Usuario creado, notificación mostrada, datos guardados en BD)"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyOutputs.length"
        :history="historyOutputs"
        :current-value="form.expectedOutputs"
        label="Salidas"
        :min-height="100"
        @revert="(val) => revertTo('expectedOutputs', val)"
      />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Mensajes del Sistema / Errores
      </label>
      <p v-if="audit?.systemMessages" class="text-xs text-gray-500">Último cambio: {{ audit.systemMessages }}</p>
      <div class="border border-gray-300 rounded-lg">
        <EditorWithReferences
          v-model="form.systemMessages"
          :projectId="projectId"
          :currentRequirementId="requirementId"
          :orgTag="orgTag"
          :projectTag="projectTag"
          placeholder="Mensajes a mostrar al usuario (Ej: 'Usuario creado con éxito', 'El email ya está registrado')"
          menuType="fixed"
        />
      </div>

      <FieldHistory
        v-if="historyMessages.length"
        :history="historyMessages"
        :current-value="form.systemMessages"
        label="Mensajes"
        :min-height="100"
        @revert="(val) => revertTo('systemMessages', val)"
      />
    </div>
  </div>
</template>
