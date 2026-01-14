import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'

import { LOGIN_MUTATION, SWITCH_ORGANIZATION_MUTATION } from '@/modules/Auth/graphql/auth.queries'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const availableOrganizations = ref(JSON.parse(localStorage.getItem('availableOrganizations') || '[]'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.systemRole <= 1)
  const isSuperAdmin = computed(() => user.value?.systemRole === 0)

  const { mutate: loginMutation } = useMutation(LOGIN_MUTATION)
  const { mutate: switchOrgMutation } = useMutation(SWITCH_ORGANIZATION_MUTATION)
  
  function saveSession(newToken, newUser, organizations = []) {
    token.value = newToken
    user.value = newUser
    availableOrganizations.value = organizations
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    localStorage.setItem('availableOrganizations', JSON.stringify(organizations))
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    availableOrganizations.value = []
    localStorage.removeItem('availableOrganizations')
  }

  async function login(username, password) {
    try {
      const result = await loginMutation({ username, password })
      if (result?.data?.login) {
        saveSession(result.data.login.token, result.data.login.user, result.data.login.availableOrganizations)
        return true
      }
    } catch (e) {
      console.error('Login failed', e)
      throw e
    }
    return false
  }

  async function switchOrganization(organizationId) {
    try {
        const result = await switchOrgMutation({ organizationId })
        if (result?.data?.switchOrganization) {
            saveSession(
                result.data.switchOrganization.token, 
                result.data.switchOrganization.user,
                result.data.switchOrganization.availableOrganizations
            )
            return true
        }
    } catch (e) {
        console.error('Switch organization failed', e)
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
    isSuperAdmin,
    isSuperAdmin,
    availableOrganizations,
    login,
    switchOrganization,
    logout,
    updateUser: (newUser) => {
        user.value = { ...user.value, ...newUser }
        localStorage.setItem('user', JSON.stringify(user.value))
    }
  }
})
