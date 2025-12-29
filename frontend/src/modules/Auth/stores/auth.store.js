import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'

import { LOGIN_MUTATION } from '@/modules/Auth/graphql/auth.queries'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.systemRole === 1)

  const { mutate: loginMutation } = useMutation(LOGIN_MUTATION)
  
  function saveSession(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function login(username, password) {
    try {
      const result = await loginMutation({ username, password })
      if (result?.data?.login) {
        saveSession(result.data.login.token, result.data.login.user)
        return true
      }
    } catch (e) {
      console.error('Login failed', e)
      throw e
    }
    return false
  }

  function logout() {
    clearSession()
    window.location.href = '/login'
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser: (newUser) => {
        user.value = { ...user.value, ...newUser }
        localStorage.setItem('user', JSON.stringify(user.value))
    }
  }
})
