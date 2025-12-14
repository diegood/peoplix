<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
  GET_COLLABORATORS, 
  UPDATE_COLLABORATOR,
  DELETE_COLLABORATOR,
} from '@/modules/Collaborators/graphql/collaborator.queries'
import { GET_CUSTOM_FIELD_DEFINITIONS } from '@/graphql/queries' // Keep global or move? Keeping global for now as it's settings.
import { useNotificationStore } from '@/stores/notificationStore'

// Components
import CollaboratorFilter from '../components/CollaboratorFilter.vue'
import CollaboratorList from '../components/CollaboratorList.vue'
import CollaboratorFormModal from '../forms/CollaboratorFormModal.vue'

const notificationStore = useNotificationStore()

// Queries
const { result, loading, error } = useQuery(GET_COLLABORATORS)
const { result: customFieldsResult } = useQuery(GET_CUSTOM_FIELD_DEFINITIONS)

// Mutations
const { mutate: updateCollaborator } = useMutation(UPDATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: deleteCollaborator } = useMutation(DELETE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })

// State
const showModal = ref(false)
const selectedCollaborator = ref(null)
const searchQuery = ref('')

// Computed
const filteredCollaborators = computed(() => {
    if (!result.value?.collaborators) return []
    if (!searchQuery.value) return result.value.collaborators
    const low = searchQuery.value.toLowerCase()
    return result.value.collaborators.filter(c => 
        c.firstName.toLowerCase().includes(low) || 
        c.lastName.toLowerCase().includes(low) ||
        c.userName?.toLowerCase().includes(low)
    )
})

// Actions
const openCreateModal = () => {
    selectedCollaborator.value = null
    showModal.value = true
}

const openEditModal = (collab) => {
    selectedCollaborator.value = collab
    showModal.value = true
}

const handleDelete = async (collabId) => {
  if (await notificationStore.showDialog('¿Estás seguro de que quieres eliminar este colaborador? Esta acción eliminará permanentemente todos sus datos asociados.')) {
     try {
       await deleteCollaborator({ id: collabId })
       notificationStore.showToast('Colaborador eliminado', 'success')
     } catch (err) {
       notificationStore.showToast(err.message || 'Error al eliminar', 'error')
     }
  }
}

const toggleActive = async (collab) => {
  try {
    await updateCollaborator({
      id: collab.id,
      isActive: !collab.isActive
    })
    notificationStore.showToast(collab.isActive ? 'Colaborador desactivado' : 'Colaborador activado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al actualizar estado', 'error')
  }
}
</script>

<template>
  <div class="container mx-auto p-8 space-y-6">
    <CollaboratorFilter 
        v-model="searchQuery" 
        @create="openCreateModal" 
    />

    <CollaboratorList 
        :collaborators="filteredCollaborators"
        :loading="loading"
        :error="error"
        @toggle-active="toggleActive"
        @delete="handleDelete"
        @edit="openEditModal"
    />

    <CollaboratorFormModal 
        :show="showModal"
        :collaborator="selectedCollaborator"
        :custom-field-definitions="customFieldsResult?.customFieldDefinitions || []"
        @close="showModal = false"
    />
  </div>
</template>
