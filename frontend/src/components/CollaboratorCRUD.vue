<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
  GET_COLLABORATORS, 
  UPDATE_COLLABORATOR,
  DELETE_COLLABORATOR,
  GET_CUSTOM_FIELD_DEFINITIONS
} from '@/graphql/queries'
import { UserPlus, Briefcase, Calendar, Edit2, Power, Trash2, Search } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import CollaboratorFormModal from './CollaboratorFormModal.vue'

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

// Computed / Helpers
const filteredCollaborators = computed(() => { // Need to import computed
    if (!result.value?.collaborators) return []
    if (!searchQuery.value) return result.value.collaborators
    const low = searchQuery.value.toLowerCase()
    return result.value.collaborators.filter(c => 
        c.firstName.toLowerCase().includes(low) || 
        c.lastName.toLowerCase().includes(low) ||
        c.userName?.toLowerCase().includes(low)
    )
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES')
}

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
  if (!confirm('¿Estás seguro de que quieres eliminar este colaborador? Esta acción eliminará permanentemente todos sus datos asociados.')) return
  
  try {
    await deleteCollaborator({ id: collabId })
    notificationStore.showToast('Colaborador eliminado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al eliminar', 'error')
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

<script>
// Separate computed import as it wasn't in setup
import { computed } from 'vue'
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
            <h2 class="text-xl font-bold text-gray-800">Colaboradores</h2>
            <p class="text-sm text-gray-500">Gestión de equipo, competencias y recursos</p>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
                <Search class="absolute left-3 top-2.5 text-gray-400" size="18" />
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Buscar colaborador..." 
                    class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
            </div>
            <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow transition-all">
                <UserPlus size="18" />
                Nuevo
            </button>
        </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-10 text-gray-500">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Cargando colaboradores...
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size="20" /> {{ error.message }}
    </div>
    
    <div v-else-if="filteredCollaborators.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
        <div class="bg-gray-50 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus size="32" />
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No se encontraron colaboradores</h3>
        <p class="text-gray-500 text-sm">Prueba con otra búsqueda o crea un nuevo colaborador.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div v-for="collab in filteredCollaborators" :key="collab.id" 
           class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
        
        <div class="p-4 flex items-center justify-between" 
             :class="{ 'opacity-60 bg-gray-50': !collab.isActive }">
            
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                   :class="collab.isActive ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'">
                {{ collab.firstName?.charAt(0) || collab.name?.charAt(0) }}
              </div>
              
              <div class="min-w-0">
                <h3 class="font-bold text-gray-800 flex items-center gap-2 text-base">
                  <span class="truncate">{{ collab.firstName }} {{ collab.lastName }}</span>
                  <span v-if="!collab.isActive" class="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Inactivo</span>
                  <span v-if="collab.userName" class="text-xs text-blue-500/80 font-normal bg-blue-50 px-1.5 rounded">@{{ collab.userName }}</span>
                </h3>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  <span class="flex items-center gap-1.5" title="Horas contratadas">
                    <Briefcase size="14" class="text-gray-400" />
                    {{ collab.contractedHours }}h
                  </span>
                  <span class="flex items-center gap-1.5" title="Fecha de ingreso">
                    <Calendar size="14" class="text-gray-400" />
                    {{ formatDate(collab.joinDate) }}
                  </span>
                  <span v-if="collab.skills?.length" class="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      {{ collab.skills.length }} Skills
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <button @click.stop="toggleActive(collab)" 
                      class="p-2 rounded-lg transition-colors"
                      :class="collab.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'"
                      :title="collab.isActive ? 'Desactivar' : 'Activar'">
                <Power size="18" />
              </button>
              
              <div class="h-6 w-px bg-gray-200 mx-1"></div>

              <button @click.stop="handleDelete(collab.id)" 
                      class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar permanentemente">
                <Trash2 size="18" />
              </button>
              <button @click.stop="openEditModal(collab)" class="p-2 hover:bg-blue-50 rounded-lg text-blue-600 bg-blue-50/50">
                <Edit2 size="18" />
              </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <CollaboratorFormModal 
        :show="showModal"
        :collaborator="selectedCollaborator"
        :custom-field-definitions="customFieldsResult?.customFieldDefinitions || []"
        @close="showModal = false"
    />
  </div>
</template>

