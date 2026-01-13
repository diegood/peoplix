<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ORG_COLLABORATORS, UPDATE_COLLABORATOR_ROLE } from '../graphql/organization.queries'
import { X, Search, ArrowUpCircle } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  modelValue: Boolean,
  organizationId: {
    type: String,
    required: true
  }
})

const ADMIN_ROLE = 1
const ORG_ADMIN_ROLE = 2
const SUPER_ADMIN_ROLE = 3

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()
const promoteSearch = ref('')

const { mutate: updateRole } = useMutation(UPDATE_COLLABORATOR_ROLE)

const { result: collaboratorsResult, refetch: refetchCollaborators, loading: loadingCollaborators } = useQuery(GET_ORG_COLLABORATORS, 
    () => ({ organizationId: props.organizationId, search: promoteSearch.value }), 
    { enabled: computed(() => !!props.ModelValue || !!props.organizationId) } 
)

const potentialAdmins = computed(() => {
    return collaboratorsResult.value?.collaborators.filter(c => c.systemRole !== ADMIN_ROLE && c.systemRole !== SUPER_ADMIN_ROLE) || []
})

const handlePromoteUser = async (user) => {
     try {
        await updateRole({ id: user.id, systemRole: ORG_ADMIN_ROLE })
        await refetchCollaborators()
        emit('success')
        notification.addToast('Usuario promovido a Administrador', 'success')
    } catch (e) {
        notification.addToast('Error al promover usuario: ' + e.message, 'error')
    }
}

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[70vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="text-md font-bold text-gray-900">Promover Usuario a Admin</h2>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition">
                    <X size="20" />
                </button>
            </div>
            
            <div class="p-4 border-b border-gray-100">
                <div class="relative">
                    <Search class="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input v-model="promoteSearch" type="text" class="pl-9 w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar por nombre o email...">
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-2">
                 <div v-if="loadingCollaborators" class="text-center py-8 text-gray-400 text-sm">Buscando usuarios...</div>
                 <div v-else-if="potentialAdmins.length === 0" class="text-center py-8 text-gray-400 text-sm">
                    No se encontraron usuarios elegibles.
                 </div>
                 <div v-else class="space-y-1">
                     <div v-for="user in potentialAdmins" :key="user.id" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition group">
                         <div class="flex items-center gap-3 overflow-hidden">
                             <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                                 {{ user.firstName[0] }}{{ user.lastName[0] }}
                             </div>
                             <div class="min-w-0">
                                 <div class="text-sm font-medium text-gray-900 truncate">{{ user.firstName }} {{ user.lastName }}</div>
                                 <div class="text-xs text-gray-500 truncate">{{ user.email }}</div>
                             </div>
                         </div>
                         <button @click="handlePromoteUser(user)" class="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1">
                             <ArrowUpCircle size="14" /> Promover
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    </div>
</template>
