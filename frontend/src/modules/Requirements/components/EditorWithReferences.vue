<script setup>
import { ref, computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { GET_FUNCTIONAL_REQUIREMENTS, GET_FUNCTIONAL_REQUIREMENT } from '@/modules/Requirements/graphql/queries'
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'
import { Link2 } from 'lucide-vue-next'
import ReferencesList from './ReferencesList.vue'
import ReferencePreviewModal from './ReferencePreviewModal.vue'
import ReferenceSelector from './ReferenceSelector.vue'
import {
  createReferenceLink,
  extractAllReferences,
  transformReferencesToHtml
} from '@/modules/Requirements/helpers/references'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  projectId: {
    type: String,
    required: true
  },
  currentRequirementId: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  menuType: {
    type: String,
    default: 'fixed'
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

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const showReferenceSelector = ref(false)
const previewRef = ref(null)
const previewData = ref(null)
const showPreview = ref(false)
const previewLoading = ref(false)

const { result: requirementsResult } = useQuery(GET_FUNCTIONAL_REQUIREMENTS, () => ({
  projectId: props.projectId
}), () => ({ enabled: showReferenceSelector.value }))

const { result: detailResult, refetch: refetchDetail } = useQuery(
  GET_FUNCTIONAL_REQUIREMENT,
  () => ({ id: previewRef.value?.id }),
  {
    fetchPolicy: 'network-only'
  }
)

watch(detailResult, (val) => {
  if (!previewRef.value || !val?.functionalRequirement) return
  const sectionData = getSectionContent(val.functionalRequirement, previewRef.value.sectionId)
  previewData.value = {
    number: previewRef.value.number,
    title: previewRef.value.title,
    section: previewRef.value.section,
    content: sectionData
  }
  showPreview.value = true
  previewLoading.value = false
})

const availableRequirements = computed(() => {
  const reqs = requirementsResult.value?.functionalRequirements || []
  return reqs.filter(r => r.id !== props.currentRequirementId)
})

const sections = [
  { id: 'basic', label: 'Básico' },
  { id: 'description', label: 'Descripción' },
  { id: 'actors', label: 'Actores' },
  { id: 'flow', label: 'Flujo' },
  { id: 'validations', label: 'Validaciones' },
  { id: 'additional', label: 'Adicional' }
]

const insertReference = (requirement) => {
  const { sectionId, sectionLabel } = requirement
  const reference = createReferenceLink(requirement.requirement, sectionId, sectionLabel, props.orgTag, props.projectTag)

  const newValue = props.modelValue + (props.modelValue ? '\n' : '') + reference
  emit('update:modelValue', newValue)
  
  showReferenceSelector.value = false
}

const removeReference = (ref) => {
  if (!props.modelValue) return
  const parser = new DOMParser()
  const doc = parser.parseFromString(props.modelValue, 'text/html')
  const el = doc.querySelector(`a[href*="/requirements/${ref.number}/section/${ref.sectionId}"]`)

  if (el) {
    const parent = el.parentElement
    el.remove()
    if (parent && parent.tagName === 'P' && parent.textContent.trim() === '') {
      parent.remove()
    }
    emit('update:modelValue', doc.body.innerHTML)
    return
  }

  const newValue = props.modelValue
    .replace(ref.text + '\n', '')
    .replace('\n' + ref.text, '')
    .replace(ref.text, '')
  emit('update:modelValue', newValue)
}

const extractReferences = computed(() => {
  return extractAllReferences(props.modelValue)
})



const navigateToReference = (ref) => {
  if (!props.orgTag || !props.projectTag) {
    alert('No se puede navegar: falta información del proyecto')
    return
  }
  router.push({
    name: 'tagged-requirement-section',
    params: {
      orgTag: props.orgTag,
      projectTag: props.projectTag,
      requirementNumber: ref.number,
      section: ref.sectionId
    }
  })
}

const openPreview = async (ref) => {
  previewRef.value = ref
  previewLoading.value = true
  try {
    const result = await refetchDetail({ id: ref.id })
    const requirement = result?.data?.functionalRequirement
    if (!requirement) {
      return
    }
    const sectionData = getSectionContent(requirement, ref.sectionId)
    previewData.value = {
      number: ref.number,
      title: ref.title,
      section: ref.section,
      content: sectionData
    }
    showPreview.value = true
    previewLoading.value = false
  } catch (err) {
    console.error('Error cargando preview de referencia', err)
    previewLoading.value = false
  }
}

const getSectionContent = (requirement, sectionId) => {
  const sectionMap = {
    basic: requirement.description || 'Sin contenido',
    description: requirement.generalDescription || 'Sin contenido',
    actors: requirement.actors || requirement.preconditions || requirement.expectedInputs || 'Sin contenido',
    flow: requirement.detailedFlow || 'Sin contenido',
    validations: requirement.validations || requirement.expectedOutputs || requirement.systemMessages || 'Sin contenido',
    additional: requirement.notes || requirement.mockupUrl || 'Sin contenido'
  }
  return transformReferencesToHtml(sectionMap[sectionId] || 'Sin contenido')
}

const closePreview = () => {
  showPreview.value = false
  previewData.value = null
  previewRef.value = null
}
</script>

<template>
  <div class="space-y-4">
    <TiptapEditor
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
      :placeholder="placeholder"
      :menuType="menuType"
    />

    <ReferencesList
      :references="extractReferences"
      :loadingRef="previewRef"
      :hasNavigation="!!(orgTag && projectTag)"
      @preview="openPreview"
      @navigate="navigateToReference"
      @remove="removeReference"
    />

    <ReferencePreviewModal
      :show="showPreview"
      :data="previewData"
      :canNavigate="!!(orgTag && projectTag)"
      @close="closePreview"
      @navigate="navigateToReference(previewRef)"
    />

    <div>
      <button
        @click="showReferenceSelector = !showReferenceSelector"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
      >
        <Link2 size="16" />
        Insertar Referencia a RF
      </button>
    </div>

    <div v-if="showReferenceSelector" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <ReferenceSelector
        :availableRequirements="availableRequirements"
        :sections="sections"
        @select="insertReference"
        @cancel="showReferenceSelector = false"
      />
    </div>
  </div>
</template>
