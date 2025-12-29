<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_TECHNOLOGIES } from '@/modules/Configuration/graphql/configuration.queries'
import { CREATE_TECHNOLOGY, DELETE_TECHNOLOGY } from '@/graphql/mutations'
import { Plus, Trash2, Server } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const { result, loading, error } = useQuery(GET_TECHNOLOGIES)
const { mutate: createTechnology } = useMutation(CREATE_TECHNOLOGY, {
  refetchQueries: ['GetTechnologies']
})
const { mutate: deleteTechnology } = useMutation(DELETE_TECHNOLOGY, {
  refetchQueries: ['GetTechnologies']
})

const newTechName = ref('')

const handleCreate = async () => {
  if (!newTechName.value) return
  await createTechnology({ name: newTechName.value })
  newTechName.value = ''
}

const handleDelete = async (id) => {
  if (await notificationStore.showDialog('¿Estás seguro de eliminar esta tecnología?')) {
    await deleteTechnology({ id })
  }
}
</script>

<template>
  <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <div class="flex items-center gap-3 mb-6">
        <div class="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Server size="24" />
        </div>
        <h2 class="text-xl font-bold text-gray-800">Gestión de Tecnologías</h2>
    </div>
    
    <div v-if="loading" class="text-gray-500">Cargando tecnologías...</div>
    <div v-if="error" class="text-red-500">Error: {{ error.message }}</div>

    <ul v-if="result && result.technologies" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <li v-for="tech in result.technologies" :key="tech.id" 
          class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-purple-300 hover:shadow-sm transition-all">
        <span class="font-medium text-gray-700">{{ tech.name }}</span>
        <button @click="handleDelete(tech.id)" 
                class="text-gray-300 hover:text-red-500 transition-colors p-1">
          <Trash2 size="16" />
        </button>
      </li>
    </ul>

    <div class="flex gap-2">
      <input v-model="newTechName" 
             @keyup.enter="handleCreate"
             placeholder="Nueva Tecnología (ej. Angular)" 
             class="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" />
      <button @click="handleCreate" 
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors flex items-center gap-1 font-medium shadow-sm hover:shadow">
        <Plus size="18" />
        Agregar
      </button>
    </div>
  </div>
</template>
