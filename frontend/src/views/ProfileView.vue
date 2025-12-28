<script setup>
import { ref, watchEffect } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ME } from '../graphql/queries'
import { UPDATE_COLLABORATOR } from '../graphql/mutations'
import { useAuthStore } from '../stores/auth'
import { Check, Loader2 } from 'lucide-vue-next'

const authStore = useAuthStore()

const { result, loading, refetch } = useQuery(GET_ME)
const { mutate: updateProfile, loading: saving } = useMutation(UPDATE_COLLABORATOR)

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
        const mutationResult = await updateProfile({
            id: result.value.me.id,
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            userName: formData.value.userName,
            password: formData.value.password || undefined 
        })
        success.value = true
        
        if (mutationResult?.data?.updateCollaborator) {
            authStore.updateUser(mutationResult.data.updateCollaborator)
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

              <div class="mb-4">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Email (Login)</label>
                  <input :value="result?.me?.email" disabled class="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
              </div>

              <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Alias (Nombre en Pantalla)</label>
                  <input v-model="formData.userName" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
              </div>

              <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Contraseña <span class="text-xs text-gray-400 font-normal">(Opcional)</span></label>
                  <input v-model="formData.password" type="password" placeholder="Deja en blanco para mantener la contraseña actual" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition" />
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
