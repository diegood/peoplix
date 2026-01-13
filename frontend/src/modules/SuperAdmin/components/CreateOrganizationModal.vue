<script setup>
import { ref, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { CREATE_ORGANIZATION_MUTATION } from '../graphql/organization.queries'
import { X } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import { getAcronym } from '@/helper/StringHelper'

defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()

const { mutate: createOrganization, loading: creating } = useMutation(CREATE_ORGANIZATION_MUTATION)

const form = ref({
  name: '',
  tag: '',
  adminEmail: '',
  adminPassword: '',
  adminFirstName: '',
  adminLastName: ''
})

watch(() => form.value.name, (newVal) => {
    if (newVal) {
        form.value.tag = getAcronym(newVal)
    }
})

const handleCreate = async () => {
    try {
        await createOrganization(form.value)
        emit('update:modelValue', false)
        form.value = { name: '', tag: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' }
        emit('success')
        notification.addToast('Organización creada exitosamente', 'success')
    } catch (e) {
        console.error(e)
        const message = e.message || 'Error al crear organización'
        notification.addToast(message, 'error')
    }
}

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900">Nueva Organización</h2>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition">
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
                <button @click="close" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">Cancelar</button>
                <button @click="handleCreate" :disabled="creating" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ creating ? 'Creando...' : 'Crear Organización' }}
                </button>
            </div>
        </div>
    </div>
</template>
