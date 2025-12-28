<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      router.push('/')
    } else {
      error.value = 'Invalid credentials'
    }
  } catch (e) {
    error.value = e.message || 'Login error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
    <div class="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
      <h2 class="text-3xl font-bold mb-6 text-center text-blue-400">Iniciar sesión</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-1">Usuario</label>
          <input 
            v-model="username"
            type="text" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
            placeholder="Enter username"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Contraseña</label>
          <input 
            v-model="password"
            type="password" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
            placeholder="Enter password"
            required
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm font-medium">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition disabled:opacity-50"
        >
          {{ isLoading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>
