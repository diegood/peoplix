<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ORG_COLLABORATORS, UPDATE_COLLABORATOR_ROLE, CREATE_ADMIN_MUTATION } from '../graphql/organization.queries'
import { X, Search, ArrowUpCircle, UserPlus } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  modelValue: Boolean,
  organizationId: {
    type: String,
    required: true
  }
})

const ADMIN_ROLE = 1
const SUPER_ADMIN_ROLE = 3

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()
const promoteSearch = ref('')

const { mutate: updateRole } = useMutation(UPDATE_COLLABORATOR_ROLE)
const { mutate: createAdmin } = useMutation(CREATE_ADMIN_MUTATION)

const { result: currentMembersResult, refetch: refetchCurrentMembers } = useQuery(GET_ORG_COLLABORATORS, 
    () => ({ organizationId: props.organizationId }), 
    { enabled: computed(() => !!props.modelValue && !!props.organizationId), fetchPolicy: 'network-only' } 
)

const { result: searchResult, loading: loadingSearch } = useQuery(GET_ORG_COLLABORATORS, 
    () => ({ organizationId: null, search: promoteSearch.value }), 
    { 
        enabled: computed(() => !!props.modelValue && promoteSearch.value.length > 2),
        debounce: 300 
    } 
)

const displayedUsers = computed(() => {
    const currentMembers = currentMembersResult.value?.collaborators || []

    if (!promoteSearch.value || promoteSearch.value.length < 3) {
        return currentMembers.filter(c => c.systemRole !== ADMIN_ROLE && c.systemRole !== SUPER_ADMIN_ROLE)
            .map(c => ({ ...c, isMember: true, localId: c.id }))
    } else {
        const results = searchResult.value?.collaborators || []
        
        return results.map(searchUser => {
            const localMember = currentMembers.find(m => m.email === searchUser.email)
            
            if (localMember) {
                 return {
                     ...searchUser,
                     isMember: true,
                     localId: localMember.id,
                     isAlreadyAdmin: (localMember.systemRole === ADMIN_ROLE || localMember.systemRole === SUPER_ADMIN_ROLE),
                     firstName: localMember.firstName,
                     lastName: localMember.lastName
                 }
            }
            return {
                ...searchUser,
                isMember: false
            }
        }).filter(u => !u.isAlreadyAdmin)
    }
})

const handlePromoteUser = async (user) => {
     try {
        await updateRole({ id: user.localId || user.id, systemRole: ADMIN_ROLE })
        await refetchCurrentMembers()
        emit('success')
        notification.showToast('Usuario promovido a Administrador', 'success')
    } catch (e) {
        notification.showToast('Error al promover usuario: ' + e.message, 'error')
    }
}

//TODO: [refactor][Medium] sacar de aca la password default y pensar otra solucion
const handleAddAdmin = async (user) => {
    try {
        await createAdmin({
            organizationId: props.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: 'TempPassword123!'
        })
        await refetchCurrentMembers()
        emit('success')
        notification.showToast(`Usuario ${user.firstName} añadido como Administrador`, 'success')
        promoteSearch.value = ''
    } catch (e) {
        notification.showToast('Error al añadir administrador: ' + e.message, 'error')
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
                 <div v-if="loadingSearch" class="text-center py-8 text-gray-400 text-sm">Buscando usuarios globales...</div>
                 <div v-else-if="displayedUsers.length === 0" class="text-center py-8 text-gray-400 text-sm">
                    {{ promoteSearch ? 'No se encontraron usuarios.' : 'No hay usuarios elegibles para promover.' }}
                 </div>
                 <div v-else class="space-y-1">
                     <div v-for="user in displayedUsers" :key="user.id" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition group">
                         <div class="flex items-center gap-3 overflow-hidden">
                             <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                                 {{ user.firstName[0] }}{{ user.lastName[0] }}
                             </div>
                             <div class="min-w-0">
                                 <div class="text-sm font-medium text-gray-900 truncate">{{ user.firstName }} {{ user.lastName }}</div>
                                 <div class="text-xs text-gray-500 truncate">{{ user.email }}</div>
                                 <div v-if="!user.isMember" class="text-[10px] text-blue-500 font-medium">Externo</div>
                             </div>
                         </div>
                         <button v-if="user.isMember" @click="handlePromoteUser(user)" class="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1">
                             <ArrowUpCircle size="14" /> Promover
                         </button>
                         <button v-else @click="handleAddAdmin(user)" class="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1">
                             <UserPlus size="14" /> Añadir Admin
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    </div>
</template>
