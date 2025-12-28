import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useRouter } from 'vue-router'

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      token
      user {
        id
        userName
        firstName
        lastName
        systemRole
      }
    }
  }
`

const ME_QUERY = gql`
  query Me {
    me {
      id
      userName
      firstName
      lastName
      systemRole
    }
  }
`

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.systemRole === 1)

  const { mutate: loginMutation } = useMutation(LOGIN_MUTATION)
  
  // We handle the query manually to allow execution when needed
  // or we could use useLazyQuery.
  // For basic auth restore:
  
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
    // router might not be available here directly depending on setup, 
    // but usually in component context or if router is imported it works.
    // Ideally redirect happens in the component calling logout.
    window.location.href = '/login'
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser: (newUser) => { // Helper to update user state without relogin
        user.value = { ...user.value, ...newUser }
        localStorage.setItem('user', JSON.stringify(user.value))
    }
  }
})
