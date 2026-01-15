<script setup>
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { ALL_ORGANIZATIONS_QUERY } from '../graphql/organization.queries'
import { Plus, Building2, Shield, Edit2, Users } from 'lucide-vue-next'
import CreateOrganizationModal from '../components/CreateOrganizationModal.vue'
import EditOrganizationModal from '../components/EditOrganizationModal.vue'
import ManageOrganizationModal from '../components/ManageOrganizationModal.vue'
import DeleteOrganizationModal from '../components/DeleteOrganizationModal.vue'
import { Trash2 } from 'lucide-vue-next'

const showCreateModal = ref(false)
const showManageModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedOrg = ref(null)

const { result, loading, error, refetch } = useQuery(ALL_ORGANIZATIONS_QUERY)

const openManageModal = (org) => {
    selectedOrg.value = org
    showManageModal.value = true
}

const openEditModal = (org) => {
    selectedOrg.value = org
    showEditModal.value = true
}

const openDeleteModal = (org) => {
    selectedOrg.value = org
    showDeleteModal.value = true
}

const handleSuccess = async () => {
    const { data } = await refetch()
    if (selectedOrg.value && data?.allOrganizations) {
        selectedOrg.value = data.allOrganizations.find(o => o.id === selectedOrg.value.id)
    }
}
</script>

<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 class="w-8 h-8 text-blue-600" />
            Organizaciones
        </h1>
        <div class="flex gap-4 text-sm mt-1">
            <span class="text-gray-500">Organizaciones: <strong>{{ result?.allOrganizations?.length || 0 }}</strong></span>
            <span class="text-gray-300">|</span>
            <span class="text-gray-500">Usuarios Totales: <strong>{{ result?.totalActiveUsers || 0 }}</strong></span>
        </div>
      </div>
      <button @click="showCreateModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium">
        <Plus size="20" />
        Nueva Organización
      </button>
    </div>

    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
        Error cargando organizaciones: {{ error.message }}
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">Cargando...</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="org in result?.allOrganizations" :key="org.id" class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition relative overflow-hidden">
             <div v-if="!org.isActive" class="absolute top-0 right-0 bg-red-500 text-white text-xs px-8 py-1 transform rotate-45 translate-x-3 translate-y-3 font-bold shadow-sm">
                BLOQUEADA
             </div>

            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold" 
                     :class="org.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'">
                    {{ org.name[0] }}
                </div>
                <span class="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
                    {{ org.tag || 'N/A' }}
                </span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">{{ org.name }}</h3>
            <div class="flex items-center gap-2 mb-4">
                <p class="text-gray-400 text-xs font-mono">{{ org.id }}</p>
                <div class="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium" title="Usuarios Activos">
                    <Users size="12" />
                    {{ org.activeCollaboratorsCount || 0 }}
                </div>
            </div>
            
            <div class="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                 <div class="flex -space-x-2">
                    <div v-for="admin in org.admins?.slice(0,3)" :key="admin.id" class="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600" title="Admin">
                        {{ admin.firstName[0] }}{{ admin.lastName[0] }}
                    </div>
                 </div>
                <div class="flex items-center gap-2">
                    <button @click="openManageModal(org)" class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                        <Shield size="16" />
                        Gestionar
                    </button>
                    <button @click="openEditModal(org)" class="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition" title="Editar">
                        <Edit2 size="16" />
                    </button>
                    <button @click="openDeleteModal(org)" class="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition" title="Eliminar">
                        <Trash2 size="16" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <CreateOrganizationModal 
        v-model="showCreateModal" 
        @success="handleSuccess" 
    />

    <ManageOrganizationModal 
        v-if="selectedOrg"
        v-model="showManageModal" 
        :organization="selectedOrg"
        @success="handleSuccess"
    />

    <EditOrganizationModal 
        v-if="selectedOrg"
        v-model="showEditModal"
        :organization="selectedOrg"
        @success="handleSuccess"
    />

    <DeleteOrganizationModal 
        v-if="selectedOrg"
        v-model="showDeleteModal"
        :organization="selectedOrg"
        @success="handleSuccess"
    />
    
  </div>
</template>
