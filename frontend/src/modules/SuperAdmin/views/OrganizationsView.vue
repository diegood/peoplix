<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { ALL_ORGANIZATIONS_QUERY, CREATE_ORGANIZATION_MUTATION, TOGGLE_ORG_STATUS_MUTATION, CREATE_ADMIN_MUTATION, GET_ORG_COLLABORATORS, UPDATE_COLLABORATOR_ROLE, UPDATE_ORGANIZATION_MUTATION } from '../graphql/organization.queries'
import { Plus, Building2, Search, X, Shield, Lock, Unlock, UserPlus, Trash2, ArrowUpCircle, Edit2 } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import { getAcronym } from '@/helper/StringHelper'
import { watch } from 'vue'

const notification = useNotificationStore()

const showCreateModal = ref(false)
const showManageModal = ref(false)
const showPromoteModal = ref(false)
const showEditModal = ref(false)
const selectedOrg = ref(null)
const searchQuery = ref('')
const adminForm = ref({ firstName: '', lastName: '', email: '', password: '' })
const promoteSearch = ref('')

const { result, loading, error, refetch } = useQuery(ALL_ORGANIZATIONS_QUERY)
const { mutate: createOrganization, loading: creating } = useMutation(CREATE_ORGANIZATION_MUTATION)
const { mutate: updateOrganization, loading: updating } = useMutation(UPDATE_ORGANIZATION_MUTATION)
const { mutate: toggleStatus, loading: toggling } = useMutation(TOGGLE_ORG_STATUS_MUTATION)
const { mutate: createAdmin, loading: creatingAdmin } = useMutation(CREATE_ADMIN_MUTATION)
const { mutate: updateRole } = useMutation(UPDATE_COLLABORATOR_ROLE)

// Org Collaborators Query (Lazy or reactive to selectedOrg)
const { result: collaboratorsResult, refetch: refetchCollaborators, loading: loadingCollaborators } = useQuery(GET_ORG_COLLABORATORS, 
    () => ({ organizationId: selectedOrg.value?.id, search: promoteSearch.value }), 
    { enabled: computed(() => !!selectedOrg.value && showPromoteModal.value) }
)

const potentialAdmins = computed(() => {
    return collaboratorsResult.value?.collaborators.filter(c => c.systemRole !== 1 && c.systemRole !== 0) || []
})

// Create Org Form
const form = ref({
  name: '',
  tag: '',
  adminEmail: '',
  adminPassword: '',
  adminFirstName: '',
  adminLastName: ''
})

// Edit Org Form
const editForm = ref({
    id: '',
    name: '',
    tag: ''
})

// Watch for create form name changes to auto-gen tag
watch(() => form.value.name, (newVal) => {
    if (newVal) {
        form.value.tag = getAcronym(newVal)
    }
})

// Watch for edit form name changes to auto-gen tag (only if tag wasn't manually edited? keeping it simple for now as requested "auto generarse")
watch(() => editForm.value.name, (newVal) => {
    if (newVal) {
        editForm.value.tag = getAcronym(newVal)
    }
})

const handleCreate = async () => {
    try {
        await createOrganization(form.value)
        showCreateModal.value = false
        // Reset form
        form.value = { name: '', tag: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' }
        refetch()
        notification.addToast('Organización creada exitosamente', 'success')
    } catch (e) {
        console.error(e)
        const message = e.message || 'Error al crear organización'
        notification.addToast(message, 'error')
    }
}

const openManageModal = (org) => {
    selectedOrg.value = org
    showManageModal.value = true
}

const openEditModal = (org) => {
    editForm.value = {
        id: org.id,
        name: org.name,
        tag: org.tag
    }
    showEditModal.value = true
}

const handleUpdateOrg = async () => {
    try {
        await updateOrganization({
            id: editForm.value.id,
            name: editForm.value.name,
            tag: editForm.value.tag
        })
        await refetch()
        showEditModal.value = false
        notification.addToast('Organización actualizada exitosamente', 'success')
    } catch (e) {
        notification.addToast('Error actualizando organización: ' + e.message, 'error')
    }
}

const handleToggleStatus = async () => {
    if (!selectedOrg.value) return
    
    const isBlocking = selectedOrg.value.isActive;
    
    if (isBlocking) {
        const confirmed = await notification.showDialog(
            'Confirmación requerida',
            `¿Estás seguro de que deseas bloquear el acceso a ${selectedOrg.value.name}? Ningún usuario podrá ingresar.`
        )
        if (!confirmed) return
    }

    try {
        await toggleStatus({ id: selectedOrg.value.id, isActive: !selectedOrg.value.isActive })
        await refetch()
        selectedOrg.value = result.value.allOrganizations.find(o => o.id === selectedOrg.value.id)
        notification.addToast(`Organización ${isBlocking ? 'bloqueada' : 'desbloqueada'} exitosamente`, 'success')
    } catch (e) {
         notification.addToast('Error cambiando estado: ' + e.message, 'error')
    }
}

const handleCreateAdmin = async () => {
    if (!selectedOrg.value) return
    try {
        await createAdmin({
            organizationId: selectedOrg.value.id,
            firstName: adminForm.value.firstName,
            lastName: adminForm.value.lastName,
            email: adminForm.value.email,
            password: adminForm.value.password,
        })
        
        await refetch()
        selectedOrg.value = result.value.allOrganizations.find(o => o.id === selectedOrg.value.id)
        
        adminForm.value = { firstName: '', lastName: '', email: '', password: '' }
        notification.addToast('Administrador creado exitosamente', 'success')
    } catch (e) {
        notification.addToast('Error creando admin: ' + e.message, 'error')
    }
}

const handleDemoteAdmin = async (admin) => {
    const confirmed = await notification.showDialog(
        'Revocar Acceso Admin',
        `¿Estás seguro de que deseas quitar los permisos de administrador a ${admin.firstName} ${admin.lastName}? Pasará a ser un usuario normal.`
    )
    if (!confirmed) return

    try {
        await updateRole({ id: admin.id, systemRole: 2 }) // 2 = User
        await refetch()
        selectedOrg.value = result.value.allOrganizations.find(o => o.id === selectedOrg.value.id)
        notification.addToast('Permisos de administrador revocados', 'success')
    } catch (e) {
        notification.addToast('Error al revocar permisos: ' + e.message, 'error')
    }
}

const handlePromoteUser = async (user) => {
     try {
        await updateRole({ id: user.id, systemRole: 1 }) // 1 = Org Admin
        await refetch()
        // Force refresh of collaborators list to remove them from "potential" list
        await refetchCollaborators()
        selectedOrg.value = result.value.allOrganizations.find(o => o.id === selectedOrg.value.id)
        notification.addToast('Usuario promovido a Administrador', 'success')
    } catch (e) {
        notification.addToast('Error al promover usuario: ' + e.message, 'error')
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
        <p class="text-gray-500 mt-1">Administra todas las organizaciones ({{ result?.allOrganizations?.length || 0 }})</p>
      </div>
      <button @click="showCreateModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium">
        <Plus size="20" />
        Nueva Organización
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
        Error cargando organizaciones: {{ error.message }}
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-12 text-gray-500">Cargando...</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="org in result?.allOrganizations" :key="org.id" class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition relative overflow-hidden">
             <!-- Status Ribbon -->
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
            <p class="text-gray-400 text-xs font-mono mb-4">{{ org.id }}</p>
            
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
                </div>
            </div>
        </div>
    </div>

    <!-- Create Org Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900">Nueva Organización</h2>
                <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600 transition">
                    <X size="24" />
                </button>
            </div>
            
            <div class="p-6 grid grid-cols-2 gap-6">
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 border-b pb-1">Datos de la Organización</h3>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Organización</label>
                        <input v-model="form.name" type="text" class="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ej. Acme Corp">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tag (Identificador)</label>
                        <input v-model="form.tag" type="text" class="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ej. ACME">
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 border-b pb-1">Primer Administrador</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input v-model="form.adminFirstName" type="text" class="w-full border-gray-300 rounded-lg text-sm" placeholder="Juan">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <input v-model="form.adminLastName" type="text" class="w-full border-gray-300 rounded-lg text-sm" placeholder="Pérez">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email (Admin)</label>
                        <input v-model="form.adminEmail" type="email" class="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" placeholder="admin@acme.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input v-model="form.adminPassword" type="password" class="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" placeholder="******">
                    </div>
                </div>
            </div>

            <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button @click="showCreateModal = false" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">Cancelar</button>
                <button @click="handleCreate" :disabled="creating" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ creating ? 'Creando...' : 'Crear Organización' }}
                </button>
            </div>
        </div>
    </div>
    
    <!-- Manage Modal -->
    <div v-if="showManageModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden h-[80vh] flex flex-col">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                    <h2 class="text-lg font-bold text-gray-900">Gestionar {{ selectedOrg?.name }}</h2>
                    <p class="text-xs text-gray-500">{{ selectedOrg?.id }}</p>
                </div>
                <button @click="showManageModal = false" class="text-gray-400 hover:text-gray-600 transition">
                    <X size="24" />
                </button>
            </div>
            
            <div class="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Status Section -->
                <div class="space-y-6">
                    <h3 class="text-md font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Shield class="w-4 h-4" /> Estado y Acceso
                    </h3>
                    
                    <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-between border" :class="selectedOrg?.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'">
                        <div>
                            <div class="font-medium" :class="selectedOrg?.isActive ? 'text-green-700' : 'text-red-700'">
                                {{ selectedOrg?.isActive ? 'Organización Activa' : 'ORGANIZACIÓN BLOQUEADA' }}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ selectedOrg?.isActive ? 'Los usuarios pueden acceder normalmente.' : 'El acceso está denegado para todos los usuarios.' }}
                            </div>
                        </div>
                        <button @click="handleToggleStatus" 
                                class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                                :class="selectedOrg?.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'">
                             <component :is="selectedOrg?.isActive ? Lock : Unlock" size="16" />
                             {{ selectedOrg?.isActive ? 'Bloquear Acceso' : 'Desbloquear' }}
                        </button>
                    </div>
                </div>

                <!-- Admins Section -->
                <div class="space-y-6">
                     <h3 class="text-md font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <UserPlus class="w-4 h-4" /> Administradores
                    </h3>
                    
                    <!-- Admin List -->
                    <div class="space-y-3 max-h-60 overflow-y-auto mb-6">
                        <div v-for="admin in selectedOrg?.admins" :key="admin.id" class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm group">
                             <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                 {{ admin.firstName[0] }}{{ admin.lastName[0] }}
                             </div>
                             <div class="flex-1 min-w-0">
                                 <div class="text-sm font-medium text-gray-900 truncate">{{ admin.firstName }} {{ admin.lastName }}</div>
                                 <div class="text-xs text-gray-500 truncate">{{ admin.email }}</div>
                             </div>
                             <button @click="handleDemoteAdmin(admin)" class="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-1" title="Revocar permisos de admin">
                                 <Trash2 size="16" />
                             </button>
                        </div>
                         <div v-if="!selectedOrg?.admins?.length" class="text-center text-gray-400 text-sm py-4 italic">
                            No hay administradores asignados (Inusual)
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Add New Admin -->
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                            <h4 class="text-sm font-medium text-gray-800">Crear Nuevo Admin</h4>
                            <div class="grid grid-cols-2 gap-2">
                                <input v-model="adminForm.firstName" class="text-sm p-2 rounded border border-gray-300 w-full" placeholder="Nombre">
                                <input v-model="adminForm.lastName" class="text-sm p-2 rounded border border-gray-300 w-full" placeholder="Apellido">
                            </div>
                            <input v-model="adminForm.email" class="text-sm p-2 rounded border border-gray-300 w-full" placeholder="Email">
                            <input v-model="adminForm.password" type="password" class="text-sm p-2 rounded border border-gray-300 w-full" placeholder="Contraseña">
                            
                            <button @click="handleCreateAdmin" :disabled="creatingAdmin" class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex justify-center items-center gap-2">
                                <Plus size="16" />
                                {{ creatingAdmin ? 'Creando...' : 'Crear Admin' }}
                            </button>
                        </div>

                        <!-- Promote Existing User -->
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 flex flex-col">
                             <h4 class="text-sm font-medium text-gray-800">Promover Usuario Existente</h4>
                             <p class="text-xs text-gray-500 mb-2">Busca usuarios de esta organización para hacerlos administradores.</p>
                             
                             <button @click="showPromoteModal = true" class="mt-auto w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex justify-center items-center gap-2">
                                <Search size="16" />
                                Buscar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
             <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                <button @click="showManageModal = false" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">Cerrar</button>
            </div>
        </div>
    </div>

    <!-- Promote Modal (Nested or separate?) Separate is better z-index wise -->
    <div v-if="showPromoteModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[70vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="text-md font-bold text-gray-900">Promover Usuario a Admin</h2>
                <button @click="showPromoteModal = false" class="text-gray-400 hover:text-gray-600 transition">
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
    


    <!-- Edit Org Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[50] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Edit2 class="w-5 h-5 text-blue-600" />
                    Editar Organización
                </h2>
                <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600 transition hover:rotate-90 duration-300">
                    <X size="24" />
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                 <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-700">Nombre de la Organización</label>
                    <div class="relative">
                        <Building2 class="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input v-model="editForm.name" type="text" class="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all bg-gray-50 focus:bg-white" placeholder="Ej: Acme Corp">
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-700">Tag (Identificador)</label>
                    <div class="relative">
                        <div class="absolute left-3 top-3 text-gray-400 text-xs font-bold border border-gray-300 rounded px-1">TAG</div>
                        <input v-model="editForm.tag" type="text" class="pl-12 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all uppercase bg-gray-50 focus:bg-white" placeholder="ACME">
                    </div>
                </div>
            </div>

            <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button @click="showEditModal = false" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
                <button @click="handleUpdateOrg" :disabled="updating" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                    <span v-if="updating" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ updating ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
            </div>
        </div>
    </div>
    
  </div>
</template>
