<script setup>
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { TOGGLE_ORG_STATUS_MUTATION, CREATE_ADMIN_MUTATION, UPDATE_COLLABORATOR_ROLE } from '../graphql/organization.queries'
import { X, Shield, Lock, Unlock, UserPlus, Trash2, Plus, Search } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import PromoteUserModal from './PromoteUserModal.vue'

const props = defineProps({
  modelValue: Boolean,
  organization: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()
const showPromoteModal = ref(false)

const { mutate: toggleStatus } = useMutation(TOGGLE_ORG_STATUS_MUTATION)
const { mutate: createAdmin, loading: creatingAdmin } = useMutation(CREATE_ADMIN_MUTATION)
const { mutate: updateRole } = useMutation(UPDATE_COLLABORATOR_ROLE)

const adminForm = ref({ firstName: '', lastName: '', email: '', password: '' })

const handleToggleStatus = async () => {
    const isBlocking = props.organization.isActive;
    
    if (isBlocking) {
        const confirmed = await notification.showDialog(
            'Confirmación requerida',
            `¿Estás seguro de que deseas bloquear el acceso a ${props.organization.name}? Ningún usuario podrá ingresar.`
        )
        if (!confirmed) return
    }

    try {
        await toggleStatus({ id: props.organization.id, isActive: !props.organization.isActive })
        emit('success')
        notification.addToast(`Organización ${isBlocking ? 'bloqueada' : 'desbloqueada'} exitosamente`, 'success')
    } catch (e) {
         notification.addToast('Error cambiando estado: ' + e.message, 'error')
    }
}

const handleCreateAdmin = async () => {
    try {
        await createAdmin({
            organizationId: props.organization.id,
            firstName: adminForm.value.firstName,
            lastName: adminForm.value.lastName,
            email: adminForm.value.email,
            password: adminForm.value.password,
        })
        
        emit('success')
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
        emit('success')
        notification.addToast('Permisos de administrador revocados', 'success')
    } catch (e) {
        notification.addToast('Error al revocar permisos: ' + e.message, 'error')
    }
}

const handlePromoteSuccess = () => {
    showPromoteModal.value = false
    emit('success')
}

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden h-[80vh] flex flex-col">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                    <h2 class="text-lg font-bold text-gray-900">Gestionar {{ organization.name }}</h2>
                    <p class="text-xs text-gray-500">{{ organization.id }}</p>
                </div>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition">
                    <X size="24" />
                </button>
            </div>
            
            <div class="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Status Section -->
                <div class="space-y-6">
                    <h3 class="text-md font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Shield class="w-4 h-4" /> Estado y Acceso
                    </h3>
                    
                    <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-between border" :class="organization.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'">
                        <div>
                            <div class="font-medium" :class="organization.isActive ? 'text-green-700' : 'text-red-700'">
                                {{ organization.isActive ? 'Organización Activa' : 'ORGANIZACIÓN BLOQUEADA' }}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                {{ organization.isActive ? 'Los usuarios pueden acceder normalmente.' : 'El acceso está denegado para todos los usuarios.' }}
                            </div>
                        </div>
                        <button @click="handleToggleStatus" 
                                class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                                :class="organization.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'">
                             <component :is="organization.isActive ? Lock : Unlock" size="16" />
                             {{ organization.isActive ? 'Bloquear Acceso' : 'Desbloquear' }}
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
                        <div v-for="admin in organization.admins" :key="admin.id" class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm group">
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
                         <div v-if="!organization.admins?.length" class="text-center text-gray-400 text-sm py-4 italic">
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
                <button @click="close" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">Cerrar</button>
            </div>
            
            <PromoteUserModal 
                v-model="showPromoteModal" 
                :organizationId="organization.id"
                @success="handlePromoteSuccess"
            />
        </div>
    </div>
</template>
