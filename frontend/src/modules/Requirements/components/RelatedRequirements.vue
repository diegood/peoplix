<script setup>
import { computed, ref } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { X, Plus } from 'lucide-vue-next'
import { GET_FUNCTIONAL_REQUIREMENTS } from '@/modules/Requirements/graphql/queries'
import { ADD_REQUIREMENT_RELATION, REMOVE_REQUIREMENT_RELATION } from '@/modules/Requirements/graphql/mutations'

const props = defineProps({
  requirementId: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  relatedTo: {
    type: Array,
    default: () => []
  },
  relatedFrom: {
    type: Array,
    default: () => []
  },
  onRefresh: {
    type: Function,
    default: () => {}
  }
})

const showSelector = ref(false)
const { result: requirementsResult } = useQuery(GET_FUNCTIONAL_REQUIREMENTS, () => ({
  projectId: props.projectId
}), () => ({ enabled: showSelector.value }))

const { mutate: addRelation } = useMutation(ADD_REQUIREMENT_RELATION, {
  refetchQueries: ['GetFunctionalRequirement']
})

const { mutate: removeRelation } = useMutation(REMOVE_REQUIREMENT_RELATION, {
  refetchQueries: ['GetFunctionalRequirement']
})

const allRequirements = computed(() => 
  (requirementsResult.value?.functionalRequirements || []).filter(
    r => r.id !== props.requirementId
  )
)

const availableRequirements = computed(() => {
  const linkedIds = new Set([
    ...props.relatedTo.map(r => r.id),
    ...props.relatedFrom.map(r => r.id)
  ])
  return allRequirements.value.filter(r => !linkedIds.has(r.id))
})

const handleAddRelation = async (toId) => {
  try {
    await addRelation({
      fromId: props.requirementId,
      toId,
      type: 'related'
    })
    props.onRefresh()
    showSelector.value = false
  } catch (error) {
    console.error('Error adding relation:', error)
  }
}

const handleRemoveRelation = async (toId) => {
  try {
    await removeRelation({
      fromId: props.requirementId,
      toId
    })
    props.onRefresh()
  } catch (error) {
    console.error('Error removing relation:', error)
  }
}

</script>

<template>
  <div class="space-y-4">
    <div>
      <h4 class="font-semibold text-gray-900 mb-2">Requisitos Relacionados</h4>
      
      <div v-if="relatedTo.length === 0 && relatedFrom.length === 0" class="text-gray-500 text-sm py-2">
        Sin relaciones
      </div>

      <div v-else class="space-y-2">
        <!-- Related To (This requirement relates to...) -->
        <div v-if="relatedTo.length > 0">
          <p class="text-xs text-gray-600 mb-1">Este requisito se relaciona con:</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="req in relatedTo"
              :key="req.id"
              class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
            >
              <span class="font-medium text-blue-900">RF-{{ req.number }}</span>
              <span class="text-blue-800">{{ req.title }}</span>
              <button
                @click="handleRemoveRelation(req.id)"
                class="ml-1 text-blue-600 hover:text-blue-900"
              >
                <X size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Related From (Other requirements relate to this) -->
        <div v-if="relatedFrom.length > 0">
          <p class="text-xs text-gray-600 mb-1">Se relacionan con este requisito:</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="req in relatedFrom"
              :key="req.id"
              class="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <span class="font-medium text-gray-900">RF-{{ req.number }}</span>
              <span class="text-gray-700">{{ req.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Relation Button -->
    <div>
      <button
        @click="showSelector = !showSelector"
        class="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition"
      >
        <Plus size="16" />
        Relacionar Requisito
      </button>
    </div>

    <!-- Selector -->
    <div v-if="showSelector" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p class="text-sm text-gray-600 mb-3">Selecciona un requisito para relacionar:</p>
      
      <div v-if="availableRequirements.length === 0" class="text-gray-500 text-sm">
        Todos los requisitos ya están relacionados
      </div>

      <div v-else class="space-y-2 max-h-48 overflow-y-auto">
        <button
          v-for="req in availableRequirements"
          :key="req.id"
          @click="handleAddRelation(req.id)"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm border border-transparent hover:border-blue-300"
        >
          <span class="font-medium text-gray-900">RF-{{ req.number }}</span>
          <span class="text-gray-600">{{ req.title }}</span>
        </button>
      </div>

      <button
        @click="showSelector = false"
        class="mt-3 w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>
