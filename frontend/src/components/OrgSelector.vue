<template>
  <div v-if="showSelector" class="relative">
    <button 
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <span>{{ currentOrgName }}</span>
      <svg class="w-5 h-5 ml-2 -mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>

    <div v-if="isOpen" class="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
      <div class="py-1">
        <div v-if="showSearch" class="px-4 py-2 border-b border-gray-100">
           <input 
             v-model="searchQuery" 
             type="text" 
             placeholder="Search organization..." 
             class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
           />
        </div>
        <a 
          v-for="org in filteredOrgs" 
          :key="org.id" 
          @click="switchOrg(org)"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          :class="{ 'bg-gray-50 font-bold': org.id === currentOrgId }"
        >
          {{ org.name }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isOpen = ref(false)
const searchQuery = ref('')

const availableOrgs = computed(() => authStore.availableOrganizations || [])
const currentOrgId = computed(() => authStore.user?.organizationId)
const currentOrgName = computed(() => authStore.user?.organization?.name || 'Cambiar Organización')

const isSuperAdmin = computed(() => authStore.isSuperAdmin)
const hasMultipleOrgs = computed(() => availableOrgs.value.length > 1)
const showSelector = computed(() => hasMultipleOrgs.value || (isSuperAdmin.value && availableOrgs.value.length > 0))
const showSearch = computed(() => availableOrgs.value.length > 3 || isSuperAdmin.value)

const filteredOrgs = computed(() => {
    if (!searchQuery.value) return availableOrgs.value
    return availableOrgs.value.filter(org => 
        org.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const switchOrg = async (org) => {
    if (org.id === currentOrgId.value) {
        isOpen.value = false
        return
    }
    
    try {
        const success = await authStore.switchOrganization(org.id)
        if (success) {
            isOpen.value = false
            router.push(`/${org.tag}/`)
        }
    } catch {
        alert('Failed to switch organization')
    }
}
</script>
