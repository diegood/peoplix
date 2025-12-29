<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ROLES } from '@/graphql/queries'
import { CREATE_ROLE, DELETE_ROLE } from '@/graphql/mutations'
import { Trash2, Plus } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const { result, loading, error } = useQuery(GET_ROLES)
const { mutate: createRole } = useMutation(CREATE_ROLE, {
  refetchQueries: ['GetRoles']
})
const { mutate: deleteRole } = useMutation(DELETE_ROLE, {
  refetchQueries: ['GetRoles']
})

const newRoleName = ref('')

const handleCreate = async () => {
  if (!newRoleName.value) return
  await createRole({ name: newRoleName.value })
  newRoleName.value = ''
}

const handleDelete = async (id) => {
  if (await notificationStore.showDialog('¿Estás seguro de eliminar este rol?')) {
    await deleteRole({ id })
  }
}
</script>

<template>
  <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Gestión de Roles</h2>
    <div class="flex gap-2">
      <input v-model="newRoleName" 
             @keyup.enter="handleCreate"
             placeholder="Nuevo nombre de rol" 
             class="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
      <button @click="handleCreate" 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-1 font-medium shadow-sm hover:shadow">
        <Plus size="18" />
        Agregar
      </button>
    </div>
    
    <div v-if="loading" class="text-gray-500">Cargando roles...</div>
    <div v-if="error" class="text-red-500">Error: {{ error.message }}</div>

    <ul v-if="result && result.roles" class="space-y-2 mb-6">
      <li v-for="role in result.roles" :key="role.id" 
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
        <span class="font-medium text-gray-700">{{ role.name }}</span>
        <button @click="handleDelete(role.id)" 
                class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size="18" />
        </button>
      </li>
    </ul>

  </div>
</template>
