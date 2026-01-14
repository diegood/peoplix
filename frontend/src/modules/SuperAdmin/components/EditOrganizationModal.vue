<script setup>
import { ref, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { UPDATE_ORGANIZATION_MUTATION } from '../graphql/organization.queries'
import { X, Edit2, Building2 } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import { getAcronym } from '@/helper/StringHelper'

const props = defineProps({
  modelValue: Boolean,
  organization: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const notification = useNotificationStore()
const { mutate: updateOrganization, loading: updating } = useMutation(UPDATE_ORGANIZATION_MUTATION)

const editForm = ref({
    id: '',
    name: '',
    tag: ''
})

watch(() => props.organization, (newVal) => {
    if (newVal) {
        editForm.value = {
            id: newVal.id,
            name: newVal.name,
            tag: newVal.tag
        }
    }
}, { immediate: true })

watch(() => editForm.value.name, (newVal) => {
    if (newVal) {
        editForm.value.tag = getAcronym(newVal)
    }
})

const handleUpdateOrg = async () => {
    try {
        await updateOrganization({
            id: editForm.value.id,
            name: editForm.value.name,
            tag: editForm.value.tag
        })
        emit('update:modelValue', false)
        emit('success')
        notification.showToast('Organización actualizada exitosamente', 'success')
    } catch (e) {
        notification.showToast('Error actualizando organización: ' + e.message, 'error')
    }
}

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[50] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Edit2 class="w-5 h-5 text-blue-600" />
                    Editar Organización
                </h2>
                <button @click="close" class="text-gray-400 hover:text-gray-600 transition hover:rotate-90 duration-300">
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
                <button @click="close" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
                <button @click="handleUpdateOrg" :disabled="updating" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                    <span v-if="updating" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ updating ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
            </div>
        </div>
    </div>
</template>
