<script setup>
import { ref, computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { GET_FUNCTIONAL_REQUIREMENTS, GET_FUNCTIONAL_REQUIREMENT } from '@/modules/Requirements/graphql/queries'
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'
import { X, Link2, Eye, ExternalLink } from 'lucide-vue-next'

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
const selectedSection = ref(null)
const previewRef = ref(null)
const previewData = ref(null)
const renderedPreviewContent = computed(() => {
  if (!previewData.value) return ''
  return transformReferencesToHtml(previewData.value.content)
})
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
  if (!selectedSection.value) {
    alert('Selecciona una sección')
    return
  }

  const sectionLabel = sections.find(s => s.id === selectedSection.value)?.label || selectedSection.value
  const href = `/${props.orgTag}/projects/${props.projectTag}/requirements/${requirement.number}/section/${selectedSection.value}?rfId=${requirement.id}`
  const reference = `<a class="rf-ref inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium" href="${href}">RF-${requirement.number}: ${requirement.title} (${sectionLabel})</a>`

  const newValue = props.modelValue + (props.modelValue ? '\n' : '') + reference
  emit('update:modelValue', newValue)
  
  showReferenceSelector.value = false
  selectedSection.value = null
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
  const matches = []

  if (props.modelValue) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(props.modelValue, 'text/html')
    
    doc.querySelectorAll('a[href*="/requirements/"][href*="/section/"]').forEach(el => {
      const hrefRef = parseHrefRef(el.getAttribute('href'))
      if (!hrefRef) return
      
      const { id, number, sectionId } = hrefRef

      if (!id || !sectionId || !number) return

      matches.push({
        text: el.outerHTML,
        number: String(number),
        title: extractTitleFromText(el.textContent),
        section: extractSectionLabelFromText(el.textContent),
        id,
        sectionId
      })
    })
  }

  return matches
})

const extractRefFromElement = (el) => {
  const hrefRef = parseHrefRef(el.getAttribute('href'))
  if (!hrefRef) return null
  
  const id = hrefRef.id
  const sectionId = hrefRef.sectionId
  const number = hrefRef.number

  if (!id || !sectionId || !number) return null

  return {
    text: el.outerHTML,
    number: String(number),
    title: extractTitleFromText(el.textContent),
    section: extractSectionLabelFromText(el.textContent),
    id,
    sectionId
  }
}

const extractTitleFromText = (text) => {
  const regex = /RF-\d+:\s([^()]+)\s\(/
  const m = text.match(regex)
  return m ? m[1].trim() : text
}

const extractSectionLabelFromText = (text) => {
  const regex = /\(([^)]+)\)/
  const m = text.match(regex)
  return m ? m[1] : ''
}

const extractNumberFromText = (text) => {
  const regex = /RF-(\d+)/
  const m = text.match(regex)
  return m ? m[1] : ''
}

const parseHrefRef = (href) => {
  if (!href) return null
  // Format: /ORG/projects/PRY/requirements/2/section/description?rfId=UUID
  const regex = /\/requirements\/(\d+)\/section\/([a-z]+)(\?rfId=([a-f0-9-]+))?/
  const m = href.match(regex)
  if (!m) return null
  return { 
    number: m[1], 
    sectionId: m[2],
    id: m[4] // UUID desde query param
  }
}

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

const isPreviewLoading = (ref) => previewLoading.value && previewRef.value?.id === ref.id

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

const transformReferencesToHtml = (content) => {
  if (!content) return 'Sin contenido'
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  doc.querySelectorAll('a.rf-ref, span.rf-ref').forEach(el => {
    const ref = extractRefFromElement(el)
    if (!ref) return
    const num = ref.number
    const section = ref.section || ref.sectionId
    const chip = `<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium">RF-${num}: ${section}</span>`
    el.replaceWith(parser.parseFromString(chip, 'text/html').body.firstChild)
  })

  return doc.body.innerHTML
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

    <div v-if="extractReferences.length > 0" class="space-y-2">
      <p class="text-sm font-medium text-gray-700">Referencias insertadas:</p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(ref, idx) in extractReferences"
          :key="idx"
          class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
        >
          <Link2 size="14" class="text-blue-600" />
          <span class="text-blue-900">
            RF-{{ ref.number }}: {{ ref.section }}
          </span>
          <div class="flex items-center gap-1 ml-2">
            <button
              @click="openPreview(ref)"
              class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded transition"
              title="Ver preview"
            >
              <Eye v-if="!isPreviewLoading(ref)" size="14" />
              <svg
                v-else
                class="animate-spin h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </button>
            <button
              v-if="orgTag && projectTag"
              @click="navigateToReference(ref)"
              class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded transition"
              title="Ir a la sección"
            >
              <ExternalLink size="14" />
            </button>
            <button
              @click="removeReference(ref)"
              class="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded transition"
              title="Eliminar referencia"
            >
              <X size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showPreview && previewData"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closePreview"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        @click.stop
      >
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              RF-{{ previewData.number }}: {{ previewData.title }}
            </h3>
            <p class="text-sm text-gray-600">Sección: {{ previewData.section }}</p>
          </div>
          <button
            @click="closePreview"
            class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded transition"
          >
            <X size="20" />
          </button>
        </div>
        <div class="px-6 py-4">
          <div class="prose max-w-none" v-html="renderedPreviewContent"></div>
        </div>
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <button
            @click="closePreview"
            class="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
          <button
            v-if="orgTag && projectTag"
            @click="navigateToReference(previewRef); closePreview()"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <ExternalLink size="16" />
            Ir a la sección
          </button>
        </div>
      </div>
    </div>

    <div>
      <button
        @click="showReferenceSelector = !showReferenceSelector"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
      >
        <Link2 size="16" />
        Insertar Referencia a RF
      </button>
    </div>

    <div v-if="showReferenceSelector" class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">Selecciona la sección:</label>
        <select
          v-model="selectedSection"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">-- Selecciona sección --</option>
          <option v-for="section in sections" :key="section.id" :value="section.id">
            {{ section.label }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">Selecciona el requisito:</label>
        <div class="max-h-48 overflow-y-auto space-y-1">
          <button
            v-if="availableRequirements.length === 0"
            disabled
            class="w-full text-left px-3 py-2 text-gray-500 text-sm"
          >
            Sin requisitos disponibles
          </button>
          <button
            v-for="req in availableRequirements"
            :key="req.id"
            @click="insertReference(req)"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm border border-transparent hover:border-blue-300"
          >
            <span class="font-medium text-gray-900">RF-{{ req.number }}</span>
            <span class="text-gray-600">{{ req.title }}</span>
          </button>
        </div>
      </div>

      <button
        @click="showReferenceSelector = false"
        class="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>
