<script setup>
import { AlertCircle, UserPlus } from 'lucide-vue-next'
import CollaboratorCard from './CollaboratorCard.vue'

defineProps({
    collaborators: Array,
    loading: Boolean,
    error: Object
})

const emit = defineEmits(['toggle-active', 'delete', 'edit'])
</script>

<template>
    <div v-if="loading" class="text-center py-10 text-gray-500">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Cargando colaboradores...
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size="20" /> {{ error.message }}
    </div>
    
    <div v-else-if="collaborators.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
        <div class="bg-gray-50 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus size="32" />
        </div>
        <h3 class="text-gray-900 font-medium mb-1">No se encontraron colaboradores</h3>
        <p class="text-gray-500 text-sm">Prueba con otra búsqueda o crea un nuevo colaborador.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <CollaboratorCard 
          v-for="collab in collaborators" 
          :key="collab.id" 
          :collab="collab"
          @toggle-active="(c) => emit('toggle-active', c)"
          @delete="(id) => emit('delete', id)"
          @edit="(c) => emit('edit', c)"
      />
    </div>
</template>
