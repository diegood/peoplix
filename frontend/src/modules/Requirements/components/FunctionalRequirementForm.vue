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
import VersionBumpModal from './VersionBumpModal.vue'
import { parseDateSafe } from '@/helper/Date'
import { useNotificationStore } from '@/stores/notificationStore'
import { GET_FUNCTIONAL_REQUIREMENT } from '@/modules/Requirements/graphql/queries'
import {
  CREATE_FUNCTIONAL_REQUIREMENT,
  UPDATE_FUNCTIONAL_REQUIREMENT,
  CREATE_EVOLUTION
} from '@/modules/Requirements/graphql/mutations'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  requirement: {
    type: Object,
    default: null
  },
  activeSection: {
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

const emit = defineEmits(['close'])

const isEditing = computed(() => !!props.requirement)

const { result: detailResult, loading: detailLoading, refetch: refetchDetail } = useQuery(
  GET_FUNCTIONAL_REQUIREMENT,
  () => ({ id: props.requirement?.id }),
  () => ({ enabled: isEditing.value && !!props.requirement?.id })
)

const { mutate: createReq, loading: createLoading } = useMutation(CREATE_FUNCTIONAL_REQUIREMENT)
const { mutate: updateReq, loading: updateLoading } = useMutation(UPDATE_FUNCTIONAL_REQUIREMENT)
const { mutate: createEvolutionMut, loading: evolutionLoading } = useMutation(CREATE_EVOLUTION)
const notificationStore = useNotificationStore()

const loading = computed(() => createLoading.value || updateLoading.value)
const detailData = computed(() => detailResult.value?.functionalRequirement)
const isBlocked = computed(() => detailData.value?.status === 'BLOCKED')

const showVersionModal = ref(false)

const currentVersion = computed(() => ({
  major: detailData.value?.versionMajor ?? 1,
  minor: detailData.value?.versionMinor ?? 0,
  patch: detailData.value?.versionPatch ?? 0
}))

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

const activeSection = ref('basic')

// Set active section from prop if provided
watch(() => props.activeSection, (newSection) => {
  if (newSection) {
    activeSection.value = newSection
  } else {
    activeSection.value = 'basic'
  }
}, { immediate: true })

const sections = [
  { id: 'basic', label: 'Básico', icon: FileText },
  { id: 'description', label: 'Descripción', icon: AlignLeft },
  { id: 'actors', label: 'Actores', icon: Users },
  { id: 'flow', label: 'Flujo', icon: ArrowRight },
  { id: 'validations', label: 'Validaciones', icon: CheckCircle2 },
  { id: 'additional', label: 'Adicional', icon: Paperclip }
]

const handleSubmit = async () => {
  if (isEditing.value) {
    if (isBlocked.value) return
    // Abrir modal de selección de versión
    showVersionModal.value = true
  } else {
    // Crear nuevo requisito
    try {
      await createReq({
        projectId: props.projectId,
        ...form.value
      })
      emit('close')
    } catch (error) {
      console.error('Error creating requirement:', error)
      notificationStore.showToast('Error al crear requisito', 'error')
    }
  }
}

const confirmVersionBump = async (versionBump) => {
  showVersionModal.value = false
  try {
    await updateReq({
      id: props.requirement.id,
      ...form.value,
      versionBump
    })
    notificationStore.showToast('Requisito actualizado', 'success')
    await refetchDetail()
    emit('close')
  } catch (error) {
    console.error('Error updating requirement:', error)
    notificationStore.showToast('Error al actualizar requisito', 'error')
  }
}

const historyEntries = computed(() => detailData.value?.history || props.requirement?.history || [])

const saveField = async (patch) => {
  if (!isEditing.value || !props.requirement?.id) return
  if (isBlocked.value) return
  await updateReq({ id: props.requirement.id, ...patch })
  await refetchDetail()
}

const displayName = (user) => {
  if (!user) return 'Usuario'
  const fn = user.collaborator?.firstName || ''
  const ln = user.collaborator?.lastName || ''
  const name = `${fn} ${ln}`.trim()
  return name || user.email || user.id || 'Usuario'
}

const fieldAudits = computed(() => {
  const map = {}
  const history = detailData.value?.history || props.requirement?.history || []
  for (const entry of history) {
    if (!entry?.diff) continue
    let diff
    try {
      diff = JSON.parse(entry.diff)
    } catch (e) {
      continue
    }
    for (const [field, change] of Object.entries(diff)) {
      if (!map[field]) {
        map[field] = {
          by: entry.changedBy,
          at: entry.createdAt,
          old: change?.old,
          new: change?.new
        }
      }
    }
  }
  return map
})

const formatAudit = (audit) => {
  if (!audit) return ''
  const when = audit.at ? parseDateSafe(audit.at)?.format('DD/MM/YYYY HH:mm') : ''
  const who = displayName(audit.by)
  return [who, when].filter(Boolean).join(' · ')
}

const sectionAudits = computed(() => ({
  basic: {
    title: formatAudit(fieldAudits.value.title),
    description: formatAudit(fieldAudits.value.description),
    status: formatAudit(fieldAudits.value.status)
  },
  description: {
    generalDescription: formatAudit(fieldAudits.value.generalDescription)
  },
  actors: {
    actors: formatAudit(fieldAudits.value.actors),
    preconditions: formatAudit(fieldAudits.value.preconditions),
    expectedInputs: formatAudit(fieldAudits.value.expectedInputs)
  },
  flow: {
    detailedFlow: formatAudit(fieldAudits.value.detailedFlow)
  },
  validations: {
    validations: formatAudit(fieldAudits.value.validations),
    expectedOutputs: formatAudit(fieldAudits.value.expectedOutputs),
    systemMessages: formatAudit(fieldAudits.value.systemMessages)
  },
  additional: {
    mockupUrl: formatAudit(fieldAudits.value.mockupUrl),
    notes: formatAudit(fieldAudits.value.notes)
  }
}))

const blockRequirement = async () => {
  if (!isEditing.value || !props.requirement?.id) return
  if (isBlocked.value) return
  await updateReq({ id: props.requirement.id, status: 'BLOCKED' })
  notificationStore.showToast('Requisito bloqueado', 'success')
  await refetchDetail()
}

const createEvolution = async () => {
  if (!isEditing.value || !props.requirement?.id) return
  const ok = await notificationStore.showDialog('¿Crear evolutivo clonado del original?', 'Crear Evolutivo')
  if (!ok) return
  try {
    await createEvolutionMut({ originalRequirementId: props.requirement.id })
    notificationStore.showToast('Evolutivo creado', 'success')
    emit('close')
  } catch (e) {
    console.error('Error creando evolutivo', e)
    notificationStore.showToast('No se pudo crear el evolutivo', 'error')
  }
}

import { UNLOCK_REQUIREMENT } from '@/modules/Requirements/graphql/mutations'
const { mutate: unlockReq, loading: unlockLoading } = useMutation(UNLOCK_REQUIREMENT)
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
const authStore = useAuthStore()
const canUnlock = computed(() => isBlocked.value && authStore.isAdmin)
const unlockRequirement = async () => {
  if (!isEditing.value || !props.requirement?.id || !canUnlock.value) return
  const ok = await notificationStore.showDialog('¿Desbloquear requisito para edición?', 'Desbloquear Requisito')
  if (!ok) return
  try {
    await unlockReq({ id: props.requirement.id, status: 'DRAFT' })
    notificationStore.showToast('Requisito desbloqueado', 'success')
    await refetchDetail()
  } catch (e) {
    notificationStore.showToast('No se pudo desbloquear', 'error')
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
      <div class="flex items-center gap-3">
        <span v-if="isEditing && detailData?.number" class="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">RF-{{ detailData.number }}</span>
        {{ isEditing ? detailData?.title : 'Nuevo Requisito Funcional' }}
        <span v-if="isBlocked" class="ml-2 text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">Bloqueado</span>
      </div>
    </template>

    <div class="flex gap-6 h-[70vh] -m-6">
      <div class="w-64 bg-gray-50 flex flex-col">
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
              v-show="activeSection === 'basic'"
              :form="form"
              :isEditing="isEditing"
              :audit="sectionAudits.basic"
              :history="historyEntries"
              :onSaveField="saveField"
              :projectId="props.projectId"
              :requirementId="props.requirement?.id"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
            />

            <SectionDescripcion
              v-show="activeSection === 'description'"
              :form="form"
              :audit="sectionAudits.description"
              :history="historyEntries"
              :onSaveField="saveField"
              :projectId="props.projectId"
              :requirementId="props.requirement?.id"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
            />

            <SectionActores
              v-show="activeSection === 'actors'"
              :form="form"
              :audit="sectionAudits.actors"
              :history="historyEntries"
              :onSaveField="saveField"
              :projectId="props.projectId"
              :requirementId="props.requirement?.id"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
            />

            <SectionFlujo
              v-show="activeSection === 'flow'"
              :form="form"
              :audit="sectionAudits.flow"
              :history="historyEntries"
              :onSaveField="saveField"
              :projectId="props.projectId"
              :requirementId="props.requirement?.id"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
            />

            <SectionValidaciones
              v-show="activeSection === 'validations'"
              :form="form"
              :audit="sectionAudits.validations"
              :history="historyEntries"
              :onSaveField="saveField"
              :projectId="props.projectId"
              :requirementId="props.requirement?.id"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
            />

            <SectionAdicional
              v-show="activeSection === 'additional'"
              :form="form"
              :audit="sectionAudits.additional"
              :history="historyEntries"
              :onSaveField="saveField"
              :requirementId="props.requirement?.id"
              :projectId="props.projectId"
              :orgTag="props.orgTag"
              :projectTag="props.projectTag"
              :relatedTo="detailData?.relatedTo || []"
              :relatedFrom="detailData?.relatedFrom || []"
              :onRefreshRelations="refetchDetail"
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
        v-if="isEditing && !isBlocked"
        @click="createEvolution"
        :disabled="evolutionLoading"
        class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition mr-2"
      >
        {{ evolutionLoading ? 'Creando...' : 'Crear Evolutivo' }}
      </button>
      <button
        v-if="isEditing && !isBlocked"
        @click="blockRequirement"
        class="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition mr-2"
      >
        Bloquear
      </button>
      <button
        v-if="isEditing && canUnlock"
        @click="unlockRequirement"
        :disabled="unlockLoading"
        class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition mr-2"
      >
        {{ unlockLoading ? 'Desbloqueando...' : 'Desbloquear' }}
      </button>
      <button
        @click="handleSubmit"
        :disabled="loading || isBlocked || !form.title || !form.description"
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
      </button>
    </template>
  </BaseModal>

  <VersionBumpModal
    :show="showVersionModal"
    :currentVersion="currentVersion"
    @close="showVersionModal = false"
    @confirm="confirmVersionBump"
  />
</template>
