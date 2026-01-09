<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500">Paquete de trabajo</p>
          <h3 class="text-lg font-semibold text-gray-900">Crear con {{ selectedCount }} requisitos</h3>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">Nombre *</label>
          <input
            type="text"
            v-model="localName"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paquete de trabajo"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            v-model="localDescription"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Opcional"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Estimación alto nivel (horas)</label>
            <input
              type="number"
              min="0"
              v-model.number="localHighLevelEstimation"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opcional"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Fecha inicio</label>
            <input
              type="date"
              v-model="localStartDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          @click="submit"
          class="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
          :disabled="!localName"
        >
          Crear paquete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  selectedCount: { type: Number, required: true },
  modelValueName: { type: String, default: '' },
  modelValueDescription: { type: String, default: '' },
  modelValueHighLevelEstimation: { type: [Number, String, null], default: null },
  modelValueStartDate: { type: String, default: '' },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['close', 'submit', 'update:name', 'update:description', 'update:high-level-estimation', 'update:start-date'])

const localName = ref(props.modelValueName)
const localDescription = ref(props.modelValueDescription)
const localHighLevelEstimation = ref(props.modelValueHighLevelEstimation)
const localStartDate = ref(props.modelValueStartDate)

watch(
  () => props.show,
  (val) => {
    if (val) {
      localName.value = props.modelValueName
      localDescription.value = props.modelValueDescription
      localHighLevelEstimation.value = props.modelValueHighLevelEstimation
      localStartDate.value = props.modelValueStartDate
    }
  }
)

watch(localName, (val) => emit('update:name', val))
watch(localDescription, (val) => emit('update:description', val))
watch(localHighLevelEstimation, (val) => emit('update:high-level-estimation', val))
watch(localStartDate, (val) => emit('update:start-date', val))

const submit = () => {
  if (!localName.value) return
  emit('submit')
}
</script>
