<script setup>
import { Calendar } from 'lucide-vue-next'
import { ref, watch, computed } from 'vue'

const props = defineProps({
    show: Boolean,
    project: Object,
    collaborator: Object,
    week: String
})

const emit = defineEmits(['close', 'confirm'])

const form = ref({
    roleId: '',
    percentage: 50
})

watch(() => props.show, (newVal) => {
    if (newVal) {
        form.value.roleId = ''
        form.value.percentage = 50
        
        if (props.project?.requiredRoles?.length === 1) {
            form.value.roleId = props.project.requiredRoles[0].role.id
        }
    }
})

const projectRoles = computed(() => {
    return props.project?.requiredRoles?.map(r => r.role) || []
})

const handleConfirm = () => {
    emit('confirm', {
        projectId: props.project.id,
        collaboratorId: props.collaborator.id,
        roleId: form.value.roleId,
        percentage: Number(form.value.percentage)
    })
}
</script>

<template>
    <div v-if="show" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white p-6 rounded-xl shadow-xl w-96">
            <h3 class="font-bold text-lg mb-4 text-gray-800">Asignar Colaborador</h3>
             <div class="bg-blue-50 text-blue-700 px-3 py-2 rounded mb-4 text-sm flex items-center gap-2">
                <Calendar size="16"/> Semana {{ week }}
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-500 mb-1">Colaborador</p>
                <div class="font-medium bg-gray-50 p-2 rounded border border-gray-200">
                    {{ collaborator?.firstName }} {{ collaborator?.lastName }}
                </div>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm text-gray-500 mb-1 font-bold">Rol Principal</label>
                <select v-model="form.roleId" class="w-full border rounded px-3 py-2">
                    <option value="" disabled>Seleccionar Rol...</option>
                    <option v-for="role in projectRoles" :key="role.id" :value="role.id">
                        {{ role.name }}
                    </option>
                </select>
                <p v-if="projectRoles.length === 0" class="text-xs text-red-400 mt-1">
                    Este proyecto no tiene roles requeridos definidos.
                </p>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm text-gray-500 mb-1 font-bold">Dedicación (%)</label>
                <input v-model="form.percentage" type="number" min="1" max="100" class="w-full border rounded px-3 py-2" />
            </div>
            
            <div class="flex justify-end gap-2">
                <button @click="emit('close')" class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancelar</button>
                <button @click="handleConfirm" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50" :disabled="!form.roleId">
                    Confirmar
                </button>
            </div>
        </div>
    </div>
</template>
