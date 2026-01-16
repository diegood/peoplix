<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ROLES } from '@/graphql/queries'
import { CREATE_ROLE, DELETE_ROLE, UPDATE_ROLE } from '@/graphql/mutations'
import { Trash2, Plus, Pencil, X, Check } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const { result, loading, error } = useQuery(GET_ROLES)
const { mutate: createRole } = useMutation(CREATE_ROLE, {
  refetchQueries: ['GetRoles']
})
const { mutate: deleteRole } = useMutation(DELETE_ROLE, {
  refetchQueries: ['GetRoles']
})
const { mutate: updateRole } = useMutation(UPDATE_ROLE)

const newRoleName = ref('')
const newRoleIsAdmin = ref(false)
const editingId = ref(null)
const editName = ref('')
const editIsAdmin = ref(false)

const handleCreate = async () => {
  if (!newRoleName.value) return
  await createRole({ name: newRoleName.value, isAdministrative: newRoleIsAdmin.value })
  newRoleName.value = ''
  newRoleIsAdmin.value = false
}

const handleDelete = async (id) => {
  if (await notificationStore.showDialog('¿Estás seguro de eliminar este rol?')) {
    await deleteRole({ id })
  }
}

const startEdit = (role) => {
  editingId.value = role.id
  editName.value = role.name
  editIsAdmin.value = role.isAdministrative
}

const cancelEdit = () => {
  editingId.value = null
  editName.value = ''
  editIsAdmin.value = false
}

const handleUpdate = async () => {
  if (!editName.value) return
  try {
    await updateRole({ 
      id: editingId.value, 
      name: editName.value, 
      isAdministrative: editIsAdmin.value 
    })
    cancelEdit()
    notificationStore.showToast('Rol actualizado', 'success')
  } catch (e) {
    notificationStore.showToast('Error al actualizar: ' + e.message, 'error')
  }
}
</script>

<template>
  <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Gestión de Roles</h2>
    <div class="flex gap-2 items-end mb-4">
      <div class="flex-1">
          <input v-model="newRoleName" 
                 @keyup.enter="handleCreate"
                 placeholder="Nuevo nombre de rol" 
                 class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
      </div>
      <div class="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" v-model="newRoleIsAdmin" class="rounded text-blue-600 focus:ring-blue-500"/>
              Es Administrativo
          </label>
      </div>
      <button @click="handleCreate" 
              class="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-1 font-medium shadow-sm hover:shadow">
        <Plus size="18" />
        Agregar
      </button>
    </div>
    
    <div v-if="loading" class="text-gray-500">Cargando roles...</div>
    <div v-if="error" class="text-red-500">Error: {{ error.message }}</div>

    <ul v-if="result && result.roles" class="space-y-2 mb-6">
      <li v-for="role in result.roles" :key="role.id" 
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
        
        <div v-if="editingId === role.id" class="flex items-center gap-2 flex-1 mr-4">
            <input v-model="editName" class="flex-1 px-2 py-1 border rounded text-sm" />
            <label class="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
              <input type="checkbox" v-model="editIsAdmin" /> Administrativo
            </label>
            <button @click="handleUpdate" class="p-1 text-green-600 hover:bg-green-50 rounded"><Check size="16"/></button>
            <button @click="cancelEdit" class="p-1 text-red-500 hover:bg-red-50 rounded"><X size="16"/></button>
        </div>

        <div v-else class="flex items-center gap-2">
            <span class="font-medium text-gray-700">{{ role.name }}</span>
            <span v-if="role.isAdministrative" class="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200">Administrativo</span>
        </div>

        <div v-if="editingId !== role.id" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="startEdit(role)" class="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50">
              <Pencil size="16" />
            </button>
            <button @click="handleDelete(role.id)" class="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
              <Trash2 size="16" />
            </button>
        </div>
      </li>
    </ul>

  </div>
</template>
