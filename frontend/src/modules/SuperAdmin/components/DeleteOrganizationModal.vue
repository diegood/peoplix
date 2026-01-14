<script setup>
import { ref, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { DELETE_ORGANIZATION_MUTATION } from '../graphql/organization.queries'
import { AlertTriangle, X } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  modelValue: Boolean,
  organization: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()
const { mutate: deleteOrganization, loading: deleting } = useMutation(DELETE_ORGANIZATION_MUTATION)

const confirmationName = ref('')
const error = ref('')

watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        confirmationName.value = ''
        error.value = ''
    }
})

const handleDelete = async () => {
    if (confirmationName.value !== props.organization.name) {
        error.value = 'El nombre no coincide'
        return
    }

    try {
        await deleteOrganization({ id: props.organization.id })
        emit('update:modelValue', false)
        emit('success')
        notification.showToast('Organización eliminada permanentemente', 'success')
    } catch (e) {
        notification.showToast('Error eliminando organización: ' + e.message, 'error')
    }
}

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-red-100">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                <h2 class="text-xl font-bold text-red-700 flex items-center gap-2">
                    <AlertTriangle class="w-6 h-6" />
                    Eliminar Organización
                </h2>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition hover:rotate-90 duration-300">
                    <X size="24" />
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                 <div class="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800">
                    <p class="font-bold mb-1">¡Esta acción es irreversible!</p>
                    <p>Se eliminará permanentemente la organización <strong>{{ organization.name }}</strong> y todos sus datos asociados:</p>
                    <ul class="list-disc list-inside mt-2 space-y-1 ml-1 opacity-90">
                        <li>Todos los proyectos y tareas</li>
                        <li>Todos los colaboradores y roles</li>
                        <li>Configuraciones y calendarios</li>
                        <li>Historial de actividades</li>
                    </ul>
                 </div>

                 <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-700">
                        Escribe <span class="font-mono bg-gray-100 px-1 rounded text-red-600 font-bold select-all">{{ organization.name }}</span> para confirmar:
                    </label>
                    <input 
                        v-model="confirmationName" 
                        type="text" 
                        class="w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 transition-all" 
                        :placeholder="organization.name"
                        @keyup.enter="handleDelete"
                    >
                    <p v-if="error" class="text-xs text-red-500 font-bold">{{ error }}</p>
                </div>
            </div>

            <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button @click="close" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
                <button 
                    @click="handleDelete" 
                    :disabled="deleting || confirmationName !== organization.name" 
                    class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span v-if="deleting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ deleting ? 'Eliminando...' : 'Eliminar Organización' }}
                </button>
            </div>
        </div>
    </div>
</template>
