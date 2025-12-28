<script setup>
import { ref, watchEffect } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useAuthStore } from '../stores/auth'
import { Check, Loader2 } from 'lucide-vue-next'

const authStore = useAuthStore()

const ME_QUERY = gql`
  query MeProfile {
    me {
      id
      userName
      firstName
      lastName
      contractedHours
      systemRole
    }
  }
`

const UPDATE_PROFILE = gql`
  mutation UpdateMyProfile($id: ID!, $userName: String, $firstName: String, $lastName: String, $password: String) {
    updateCollaborator(id: $id, userName: $userName, firstName: $firstName, lastName: $lastName, password: $password) {
       id
       firstName
       lastName
       userName
    }
  }
`

const { result, loading, refetch } = useQuery(ME_QUERY)
const { mutate: updateProfile, loading: saving } = useMutation(UPDATE_PROFILE)

const formData = ref({
    firstName: '',
    lastName: '',
    userName: '',
    password: '' // Optional
})

// Populate form
watchEffect(() => {
    if (result.value?.me) {
        const me = result.value.me
        formData.value.firstName = me.firstName
        formData.value.lastName = me.lastName
        formData.value.userName = me.userName
    }
})

const success = ref(false)

const handleSave = async () => {
    success.value = false
    try {
        await updateProfile({
            id: result.value.me.id,
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            userName: formData.value.userName,
            password: formData.value.password || undefined 
        })
        success.value = true
        
        // Update local auth store so sidebar updates immediately
        if (result.value?.updateCollaborator) {
            authStore.updateUser(result.value.updateCollaborator)
        }
        
        setTimeout(() => success.value = false, 3000)
        refetch()
    } catch (e) {
        console.error(e)
        alert('Failed to update profile')
    }
}
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Mi perfil</h1>
      <p class="text-gray-500 mb-8">Gestionar tu información personal</p>
      
      <div v-if="loading" class="py-10 flex justify-center"><Loader2 class="animate-spin text-blue-500"/></div>
      
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form @submit.prevent="handleSave" class="space-y-6 max-w-lg">
              <div class="grid grid-cols-2 gap-6">
                  <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                      <input v-model="formData.firstName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
                  </div>
                   <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                      <input v-model="formData.lastName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
                  </div>
              </div>

              <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
                  <input v-model="formData.userName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
              </div>

              <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Contraseña <span class="text-xs text-gray-400 font-normal">(Opcional)</span></label>
                  <input v-model="formData.password" type="password" placeholder="Leave blank to keep current password" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
              </div>

               <div class="pt-4">
                   <button :disabled="saving" type="submit" class="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-500/30 disabled:opacity-50">
                       <Loader2 v-if="saving" class="animate-spin" size="20" />
                       <Check v-else-if="success" size="20" />
                       <span>{{ success ? 'Guardado!' : 'Guardar cambios' }}</span>
                   </button>
               </div>
          </form>
      </div>
  </div>
</template>
