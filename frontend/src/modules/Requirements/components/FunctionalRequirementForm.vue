<script setup>
import { ref, computed, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { FileText, AlignLeft, Users, ArrowRight, CheckCircle2, Paperclip } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'
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

          <div v-else class="max-w-4xl mx-auto">
            <div v-show="activeSection === 'basico'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Título de la Funcionalidad *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="Ej: Gestión de Usuarios"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <p class="text-xs text-gray-500 mt-2">Breve y clara descripción de la funcionalidad</p>
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Descripción Breve *
                </label>
                <div class="border border-gray-300 rounded-lg h-48">
                  <TiptapEditor
                    v-model="form.description"
                    placeholder="Explica brevemente qué hace esta funcionalidad"
                    menuType="fixed"
                  />
                </div>
              </div>

              <div v-if="isEditing" class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Estado
                </label>
                <select
                  v-model="form.status"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PENDING_REVIEW">Pendiente de Revisión</option>
                  <option value="VALIDATED">Validado</option>
                  <option value="DEPRECATED">Deprecado</option>
                </select>
              </div>
            </div>

            <div v-show="activeSection === 'descripcion'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Descripción General
                </label>
                <div class="border border-gray-300 rounded-lg h-96">
                  <TiptapEditor
                    v-model="form.generalDescription"
                    placeholder="Explica en detalle qué hace la funcionalidad y su propósito en el sistema"
                    menuType="fixed"
                  />
                </div>
              </div>
            </div>

            <div v-show="activeSection === 'actores'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Actores Involucrados
                </label>
                <div class="border border-gray-300 rounded-lg h-48">
                  <TiptapEditor
                    v-model="form.actors"
                    placeholder="¿Quién usará esta funcionalidad? (Ej: Administrador, Usuario Final, API externa)"
                    menuType="fixed"
                  />
                </div>
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                </label>
                <div class="border border-gray-300 rounded-lg h-48">
                  <TiptapEditor
                    v-model="form.preconditions"
                    placeholder="Requisitos o estado previo necesario (Ej: El usuario debe estar autenticado)"
                    menuType="fixed"
                  />
                </div>
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                </label>
                <div class="border border-gray-300 rounded-lg h-48">
                  <TiptapEditor
                    v-model="form.expectedInputs"
                    placeholder="Datos necesarios (Ej: Nombre de usuario, Email, Rol del usuario)"
                    menuType="fixed"
                  />
                </div>
              </div>
            </div>

            <div v-show="activeSection === 'flujo'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Comportamiento / Flujo Detallado
                </label>
                <div class="border border-gray-300 rounded-lg h-96">
                  <TiptapEditor
                    v-model="form.detailedFlow"
                    placeholder="Pasos secuenciales del funcionamiento (Ej: 1. El usuario accede... 2. Presiona... 3. El sistema...)"
                    menuType="fixed"
                  />
                </div>
              </div>
            </div>

            <div v-show="activeSection === 'validaciones'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Validaciones y Reglas de Negocio
                </label>
                <div class="border border-gray-300 rounded-lg h-64">
                  <TiptapEditor
                    v-model="form.validations"
                    placeholder="Condiciones o reglas que deben cumplirse (Ej: Email único, rol obligatorio)"
                    menuType="fixed"
                  />
                </div>
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Salidas / Resultados Esperados
                </label>
                <div class="border border-gray-300 rounded-lg h-64">
                  <TiptapEditor
                    v-model="form.expectedOutputs"
                    placeholder="Qué debe generarse tras ejecutar (Ej: Usuario creado, notificación mostrada, datos guardados en BD)"
                    menuType="fixed"
                  />
                </div>
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Mensajes del Sistema / Errores
                </label>
                <div class="border border-gray-300 rounded-lg h-64">
                  <TiptapEditor
                    v-model="form.systemMessages"
                    placeholder="Mensajes a mostrar al usuario (Ej: 'Usuario creado con éxito', 'El email ya está registrado')"
                    menuType="fixed"
                  />
                </div>
              </div>
            </div>

            <div v-show="activeSection === 'adicional'" class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  URL del Mockup / Diseño
                </label>
                <input
                  v-model="form.mockupUrl"
                  type="url"
                  placeholder="https://..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div class="bg-white p-6 rounded-lg shadow-sm border">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Notas Adicionales
                </label>
                <div class="border border-gray-300 rounded-lg h-64">
                  <TiptapEditor
                    v-model="form.notes"
                    placeholder="Aclaraciones para evitar suposiciones o malentendidos"
                    menuType="fixed"
                  />
                </div>
              </div>
            </div>
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
