<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_COLLABORATORS } from '../graphql/queries'
import { CREATE_COLLABORATOR, UPDATE_COLLABORATOR, DELETE_COLLABORATOR } from '../graphql/mutations'
import { Loader2, Plus, Edit2, Trash2, X } from 'lucide-vue-next'

const isModalOpen = ref(false)
const isEditing = ref(false)
const currentUser = ref({})

const { result, loading, refetch } = useQuery(GET_COLLABORATORS)
const collaborators = computed(() => result.value?.collaborators || [])

const { mutate: createCollaborator } = useMutation(CREATE_COLLABORATOR)
const { mutate: updateCollaborator } = useMutation(UPDATE_COLLABORATOR)
const { mutate: deleteCollaborator } = useMutation(DELETE_COLLABORATOR)

const formData = ref({
  userName: '',
  firstName: '',
  lastName: '',
  contractedHours: 40,
  systemRole: 2 // default User
})

const openModal = (user = null) => {
  if (user) {
    isEditing.value = true
    currentUser.value = user
    formData.value = { 
        userName: user.userName, 
        firstName: user.firstName, 
        lastName: user.lastName,
        contractedHours: user.contractedHours,
        systemRole: user.systemRole || 2,
        password: '' // Reset password field
    }
  } else {
    isEditing.value = false
    currentUser.value = {}
    formData.value = { userName: '', firstName: '', lastName: '', contractedHours: 40, systemRole: 2, password: '' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSubmit = async () => {
    try {
        if (isEditing.value) {
            await updateCollaborator({ 
                id: currentUser.value.id,
                ...formData.value,
                password: formData.value.password || undefined
            })
        } else {
            await createCollaborator({
                ...formData.value,
                joinDate: new Date().toISOString(),
                password: formData.value.password || '123456' // Default if not provided
            })
        }
        refetch()
        closeModal()
    } catch (e) {
        console.error(e)
        alert('Error saving user')
    }
}

const handleDelete = async (id) => {
    if(!confirm('Are you sure?')) return
    try {
        await deleteCollaborator({ id })
        refetch()
    } catch (e) {
        console.error(e)
    }
}
</script>

<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Gestión de usuarios</h1>
        <p class="text-gray-500">Gestión de usuarios y roles del sistema</p>
      </div>
      <button @click="openModal()" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-500/30">
        <Plus size="20" />
        <span>Agregar usuario</span>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="animate-spin text-blue-500" size="40" />
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-6 py-4 font-semibold text-gray-700">Nombre</th>
            <th class="px-6 py-4 font-semibold text-gray-700">Usuario</th>
            <th class="px-6 py-4 font-semibold text-gray-700">Rol</th>
            <th class="px-6 py-4 font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="collab in collaborators" :key="collab.id" class="hover:bg-gray-50/50 transition">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">{{ collab.firstName }} {{ collab.lastName }}</div>
            </td>
             <td class="px-6 py-4 text-gray-600">{{ collab.userName }}</td>
             <td class="px-6 py-4">
                <span :class="collab.systemRole === 1 ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {{ collab.systemRole === 1 ? 'Admin' : 'User' }}
                </span>
             </td>
             <td class="px-6 py-4">
               <div class="flex gap-2">
                 <button @click="openModal(collab)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                   <Edit2 size="16" />
                 </button>
                 <button @click="handleDelete(collab.id)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                   <Trash2 size="16" />
                 </button>
               </div>
             </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 transform transition-all scale-100">
         <div class="flex justify-between items-center mb-6">
           <h3 class="text-xl font-bold text-gray-800">{{ isEditing ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
           <button @click="closeModal" class="p-1 rounded-full hover:bg-gray-100 transition"><X size="20" class="text-gray-500"/></button>
         </div>
         
         <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                   <input v-model="formData.firstName" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                   <label class="block text-sm font-medium mb-1 text-gray-700">Apellido</label>
                   <input v-model="formData.lastName" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" required />
                </div>
            </div>
            
            <div>
               <label class="block text-sm font-medium mb-1 text-gray-700">Email (Login)</label>
               <input v-model="formData.userName" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" required />
            </div>

            <div>
               <label class="block text-sm font-medium mb-1 text-gray-700">Contraseña <span class="text-xs text-gray-400 font-normal">(Opcional para edición)</span></label>
               <input v-model="formData.password" type="password" placeholder="Establecer contraseña" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" />
            </div>

            <div>
               <label class="block text-sm font-medium mb-1 text-gray-700">Rol</label>
               <select v-model.number="formData.systemRole" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none">
                   <option :value="2">User</option>
                   <option :value="1">Admin</option>
               </select>
            </div>
            
            <div class="pt-4 flex justify-end gap-3">
               <button type="button" @click="closeModal" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
               <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/30">Guardar usuario</button>
            </div>
         </form>
      </div>
    </div>
  </div>
</template>
