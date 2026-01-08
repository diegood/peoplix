<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import FunctionalRequirementForm from '@/modules/Requirements/components/FunctionalRequirementForm.vue'
import FunctionalRequirementCard from '@/modules/Requirements/components/FunctionalRequirementCard.vue'
import { GET_FUNCTIONAL_REQUIREMENTS } from '@/modules/Requirements/graphql/queries'
import { DELETE_FUNCTIONAL_REQUIREMENT } from '@/modules/Requirements/graphql/mutations'
import { GET_PROJECTS } from '@/modules/Projects/graphql/project.queries'

const route = useRoute()
const router = useRouter()

const { result: projectsResult } = useQuery(GET_PROJECTS)
const projects = computed(() => projectsResult.value?.projects || [])

const projectId = computed(() => {
  if (route.params.projectTag) {
    const project = projects.value.find(p => p.tag === route.params.projectTag)
    return project?.id || null
  }
  return null
})

const projectName = computed(() => {
  if (route.params.projectTag) {
    const project = projects.value.find(p => p.tag === route.params.projectTag)
    return project?.name || 'Desconocido'
  }
  return 'Desconocido'
})

const selectedRequirement = ref(null)
const showForm = ref(false)
const filterStatus = ref(null)
const activeSection = ref(null)

const { result, loading, error, refetch } = useQuery(
  GET_FUNCTIONAL_REQUIREMENTS,
  () => ({
    projectId: projectId.value,
    status: filterStatus.value
  }),
  () => ({ enabled: !!projectId.value })
)

const { mutate: deleteRequirement } = useMutation(DELETE_FUNCTIONAL_REQUIREMENT)

const requirements = computed(() => result.value?.functionalRequirements || [])

const selectedRequirementFromURL = computed(() => {
  const number = route.params.requirementNumber
  if (number) {
    return requirements.value.find(r => r.number === parseInt(number))
  }
  return null
})

watch(selectedRequirementFromURL, (req) => {
  if (req) {
    selectedRequirement.value = req
    showForm.value = true
    if (route.params.section) {
      activeSection.value = route.params.section
    } else {
      activeSection.value = null
    }
  }
})

const statusLabels = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'Pendiente de Revisión',
  VALIDATED: 'Validado',
  DEPRECATED: 'Deprecado'
}

const handleCreateNew = () => {
  selectedRequirement.value = null
  showForm.value = true
}

const handleEdit = (req) => {
  selectedRequirement.value = req
  showForm.value = true
  if (route.name.startsWith('tagged-')) {
    router.push({
      name: 'tagged-requirement-detail',
      params: {
        orgTag: route.params.orgTag,
        projectTag: route.params.projectTag,
        requirementNumber: req.number
      }
    })
  }
}

const handleDelete = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este requisito?')) return
  try {
    await deleteRequirement({ id })
    refetch()
  } catch (err) {
    console.error('Error deleting requirement:', err)
  }
}

const handleFormClose = () => {
  showForm.value = false
  selectedRequirement.value = null
  refetch()
  if (route.name.startsWith('tagged-')) {
    router.push({
      name: 'tagged-requirements',
      params: {
        orgTag: route.params.orgTag,
        projectTag: route.params.projectTag
      }
    })
  }
}

const requirementStats = computed(() => ({
  total: requirements.value.length,
  draft: requirements.value.filter(r => r.status === 'DRAFT').length,
  validated: requirements.value.filter(r => r.status === 'VALIDATED').length,
  pending: requirements.value.filter(r => r.status === 'PENDING_REVIEW').length
}))
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <div class="bg-white p-6 flex items-center justify-between">
      <div class="flex flex-col items-start gap-4">
        <a href="/projects" class="text-gray-500 hover:text-gray-700">
          Proyectos
        </a>
        <h2 class="text-xl font-bold text-gray-900">Requisitos Funcionales - {{ projectName }}</h2>
      </div>
      <button
        @click="handleCreateNew"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        + Nuevo Requisito
      </button>
    </div>

    <div class="bg-white p-6 grid grid-cols-4 gap-4">
      <div class="bg-gray-50 p-4 rounded-lg cursor-pointer" @click="filterStatus = null">
        <p class="text-gray-600 text-sm">Total</p>
        <p class="text-2xl font-bold">{{ requirementStats.total }}</p>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg cursor-pointer" @click="filterStatus = 'DRAFT'">
        <p class="text-yellow-600 text-sm">Borradores</p>
        <p class="text-2xl font-bold">{{ requirementStats.draft }}</p>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg cursor-pointer" @click="filterStatus = 'PENDING_REVIEW'">
        <p class="text-blue-600 text-sm">Pendientes de Revisión</p>
        <p class="text-2xl font-bold">{{ requirementStats.pending }}</p>
      </div>
      <div class="bg-green-50 p-4 rounded-lg cursor-pointer" @click="filterStatus = 'VALIDATED'">
        <p class="text-green-600 text-sm">Validados</p>
        <p class="text-2xl font-bold">{{ requirementStats.validated }}</p>
      </div>
    </div>
    <h2 class="text-xl font-semibold mb-4 ml-6 text-gray-700"> {{ filterStatus ? statusLabels[filterStatus] : 'Todos' }}</h2>
    <div class="flex-1 overflow-auto p-6">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Cargando requisitos...</p>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 p-6 rounded-lg">
        <p class="text-red-700">{{ error.message }}</p>
      </div>

      <div v-else-if="requirements.length === 0" class="bg-gray-100 p-12 rounded-lg text-center">
        <p class="text-gray-600">No hay requisitos funcionales.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunctionalRequirementCard
          v-for="req in requirements"
          :key="req.id"
          :requirement="req"
          @edit="handleEdit(req)"
          @delete="handleDelete(req.id)"
        />
      </div>
    </div>

    <FunctionalRequirementForm
      v-if="showForm"
      :projectId="projectId"
      :requirement="selectedRequirement"
      :activeSection="activeSection"
      :orgTag="route.params.orgTag"
      :projectTag="route.params.projectTag"
      @close="handleFormClose"
    />
  </div>
</template>
