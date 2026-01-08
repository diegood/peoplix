<script setup>
import { ref, computed, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { FileText, AlignLeft, Users, ArrowRight, CheckCircle2, Paperclip } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import SectionBasic from './sections/SectionBasic.vue'
import SectionDescripcion from './sections/SectionDescripcion.vue'
import SectionActores from './sections/SectionActores.vue'
import SectionFlujo from './sections/SectionFlujo.vue'
import SectionValidaciones from './sections/SectionValidaciones.vue'
import SectionAdicional from './sections/SectionAdicional.vue'
import { GET_FUNCTIONAL_REQUIREMENT } from '@/modules/Requirements/graphql/queries'
import {
  CREATE_FUNCTIONAL_REQUIREMENT,
  UPDATE_FUNCTIONAL_REQUIREMENT
} from '@/modules/Requirements/graphql/mutations'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  requirement: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const isEditing = computed(() => !!props.requirement)

const { result: detailResult, loading: detailLoading, refetch: refetchDetail } = useQuery(
  GET_FUNCTIONAL_REQUIREMENT,
  () => ({ id: props.requirement?.id }),
  () => ({ enabled: isEditing.value })
)

const { mutate: createReq, loading: createLoading } = useMutation(CREATE_FUNCTIONAL_REQUIREMENT)
const { mutate: updateReq, loading: updateLoading } = useMutation(UPDATE_FUNCTIONAL_REQUIREMENT)

const loading = computed(() => createLoading.value || updateLoading.value)
const detailData = computed(() => detailResult.value?.functionalRequirement)

const form = ref({
  title: '',
  description: '',
  generalDescription: '',
  actors: '',
  preconditions: '',
  expectedInputs: '',
  detailedFlow: '',
  validations: '',
  expectedOutputs: '',
  systemMessages: '',
  mockupUrl: '',
  notes: '',
  status: 'DRAFT'
})

watch(detailData, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  }
}, { immediate: true })

const activeSection = ref('basico')

const sections = [
  { id: 'basico', label: 'Básico', icon: FileText },
  { id: 'descripcion', label: 'Descripción', icon: AlignLeft },
  { id: 'actores', label: 'Actores', icon: Users },
  { id: 'flujo', label: 'Flujo', icon: ArrowRight },
  { id: 'validaciones', label: 'Validaciones', icon: CheckCircle2 },
  { id: 'adicional', label: 'Adicional', icon: Paperclip }
]

const handleSubmit = async () => {
  try {
    if (isEditing.value) {
      await updateReq({
        id: props.requirement.id,
        ...form.value
      })
      await refetchDetail()
    } else {
      await createReq({
        projectId: props.projectId,
        ...form.value
      })
    }
    emit('close')
  } catch (error) {
    console.error('Error saving requirement:', error)
  }
}
</script>

<template>
  <BaseModal
    :isOpen="true"
    maxWidth="max-w-7xl"
    @close="emit('close')"
  >
    <template #title>
      {{ isEditing ? 'Editar Requisito' : 'Nuevo Requisito Funcional' }}
    </template>

    <div class="flex gap-6 h-[70vh] -m-6">
      <div class="w-64 bg-gray-50 border-r flex flex-col">
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id"
            :class="[
              'w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3',
              activeSection === section.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <component :is="section.icon" size="20" />
            <span class="font-medium">{{ section.label }}</span>
          </button>
        </nav>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden pt-6 pr-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          {{ sections.find(s => s.id === activeSection)?.label }}
        </h3>

        <div class="flex-1 overflow-auto">
          <div v-if="detailLoading && isEditing" class="text-center py-12">
            <p class="text-gray-500">Cargando...</p>
          </div>

          <div v-else class="max-w-4xl mx-auto space-y-6">
            <SectionBasic
              v-show="activeSection === 'basico'"
              :form="form"
              :isEditing="isEditing"
            />

            <SectionDescripcion
              v-show="activeSection === 'descripcion'"
              :form="form"
            />

            <SectionActores
              v-show="activeSection === 'actores'"
              :form="form"
            />

            <SectionFlujo
              v-show="activeSection === 'flujo'"
              :form="form"
            />

            <SectionValidaciones
              v-show="activeSection === 'validaciones'"
              :form="form"
            />

            <SectionAdicional
              v-show="activeSection === 'adicional'"
              :form="form"
            />
          </div>
        </div>
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
        @click="handleSubmit"
        :disabled="loading || !form.title || !form.description"
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
      </button>
    </template>
  </BaseModal>
</template>
