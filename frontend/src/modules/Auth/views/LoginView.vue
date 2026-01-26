<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { app as firebaseApp } from '@/config/firebase'
import { useRecaptcha } from '@/composables/useRecaptcha'

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const { executeRecaptcha } = useRecaptcha()

// Helper to process authentication result
const processAuth = async (user) => {
    // 1. Execute ReCAPTCHA
    const recaptchaToken = await executeRecaptcha('LOGIN')

    // 2. Get Token
    const firebaseToken = await user.getIdToken()

    // 3. Backend Login
    const success = await authStore.login(firebaseToken, recaptchaToken)
    if (success) {
      // Router root redirect will handle routing to /create-org if needed
      router.push('/')
    } else {
      error.value = 'Failed to establish session'
    }
} // Removed catch here as it's caught in the caller

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const auth = getAuth(firebaseApp)
    const userCredential = await signInWithEmailAndPassword(auth, username.value, password.value)
    
    await processAuth(userCredential.user)

  } catch (e) {
    console.error(e)
    if (e.code === 'auth/invalid-credential') {
       error.value = 'Invalid email or password'
    } else if (e.code === 'auth/too-many-requests') {
       error.value = 'Too many failed attempts. Please try again later.'
    } else {
       // Show backend error message directly if available
       error.value = e.message?.replace('GraphQL error: ', '') || 'Login error'
    }
  } finally {
    isLoading.value = false
  }
}


const handleGoogleLogin = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    const auth = getAuth(firebaseApp)
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    
    await processAuth(result.user)

  } catch (e) {
    console.error('Google Sign-In Error:', e)
    if (e.code === 'auth/popup-closed-by-user') {
        // Ignore if user closed popup
        return;
    }
    error.value = e.message?.replace('GraphQL error: ', '') || 'Failed to sign in with Google'
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
          <label class="block text-sm font-medium mb-1">Email</label>
          <input 
            v-model="username"
            type="email" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
            placeholder="tu@email.com"
            required
            autocomplete="email"
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
            autocomplete="current-password"
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
          {{ isLoading ? 'Verificando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="mt-6 flex items-center justify-between">
         <span class="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
         <span class="text-xs text-center text-gray-500 uppercase">o continuar con</span>
         <span class="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
      </div>

      <div class="mt-6">
        <button 
          @click="handleGoogleLogin"
          :disabled="isLoading"
          type="button"
          class="w-full flex justify-center items-center gap-2 py-2 bg-white text-gray-700 hover:bg-gray-100 rounded font-bold transition disabled:opacity-50"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
      </div>

    </div>
  </div>
</template>
