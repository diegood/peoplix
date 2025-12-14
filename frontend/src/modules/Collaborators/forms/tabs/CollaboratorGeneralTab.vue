<script setup>
import { ref, watch, computed } from 'vue'
import { User, Briefcase } from 'lucide-vue-next'
import { useQuery } from '@vue/apollo-composable'

const props = defineProps({
  form: { type: Object, required: true },
  customFieldForm: { type: Object, required: true },
  customFieldDefinitions: { type: Array, default: () => [] },
  isEditing: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'update:form', 'update:customFieldForm'])

// Check if we need to fetch Work Centers here or pass them as props.
// Fetching here keeps the Tab self-contained.
import { GET_WORK_CENTERS } from '@/graphql/queries'

const { result: wcResult } = useQuery(GET_WORK_CENTERS)
const workCenters = computed(() => wcResult.value?.workCenters || [])

// Local state to avoid mutating props directly
const localForm = ref({ ...props.form })
const localCustomFieldForm = ref({ ...props.customFieldForm })
if (localForm.value.workCenterId === undefined) localForm.value.workCenterId = null;

// Sync from parent to local (if parent updates from outside)
watch(() => props.form, (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localForm.value)) {
        localForm.value = { ...newVal }
    }
     // Ensure workCenterId is reactive even if missing in prop initially
    if (localForm.value.workCenterId === undefined) localForm.value.workCenterId = null;
}, { deep: true })

watch(() => props.customFieldForm, (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localCustomFieldForm.value)) {
        localCustomFieldForm.value = { ...newVal }
    }
}, { deep: true })

// Sync from local to parent (when user types)
watch(localForm, (newVal) => {
    emit('update:form', newVal)
}, { deep: true })

watch(localCustomFieldForm, (newVal) => {
    emit('update:customFieldForm', newVal)
}, { deep: true })

const handleSubmit = () => {
    emit('save')
}

const getFieldOptions = (field) => {
    if (!field.fieldConfig) return []
    try {
        const config = JSON.parse(field.fieldConfig)
        return config.options || []
    } catch {
        return []
    }
}
</script>

<template>
    <div class="space-y-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Basic Info -->
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h3 class="font-bold text-gray-700 text-sm flex items-center gap-2 mb-3">
                        <User size="16" class="text-blue-500"/> Información Básica
                    </h3>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- User Name -->
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                            <input v-model="localForm.userName" type="text" placeholder="@usuario" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                        </div>
                        <!-- First Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nombre *</label>
                            <input v-model="localForm.firstName" type="text" required class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                        </div>
                        <!-- Last Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Apellidos *</label>
                            <input v-model="localForm.lastName" type="text" required class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                        </div>
                        <!-- Contracted Hours -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Horas Contratadas (Mensual)</label>
                            <div class="mt-1 relative rounded-md shadow-sm">
                                <input v-model.number="localForm.contractedHours" type="number" required min="1" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md">
                                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 sm:text-sm">hrs</span>
                                </div>
                            </div>
                        </div>

                        <!-- Join Date -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                            <input v-model="localForm.joinDate" type="date" required class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                        </div>

                        <!-- Work Center -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Centro de Trabajo</label>
                            <select v-model="localForm.workCenterId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option :value="null">Sin asignar (Remoto/Nacional)</option>
                                <option v-for="wc in workCenters" :key="wc.id" :value="wc.id">
                                    {{ wc.name }} ({{ wc.countryCode }}{{ wc.regionCode ? '-' + wc.regionCode : '' }})
                                </option>
                            </select>
                        </div>
                        
                        <!-- Active Status -->
                        <div class="flex items-center h-full pt-6">
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" v-model="localForm.isActive" class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                                <span class="ml-2 text-gray-700">Activo / Disponible</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Custom Fields -->
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h3 class="font-bold text-gray-700 text-sm flex items-center gap-2 mb-3">
                        <Briefcase size="16" class="text-purple-500"/> Detalles Adicionales
                    </h3>
                    <div v-if="customFieldDefinitions.length > 0" class="space-y-3">
                        <div v-for="field in customFieldDefinitions" :key="field.id">
                            <label class="block text-sm font-medium text-gray-700">{{ field.fieldLabel }}</label>
                            
                            <!-- Text / Number / Date / Email -->
                            <input 
                                v-if="['text', 'number', 'date', 'email'].includes(field.fieldType)"
                                :type="field.fieldType"
                                v-model="localCustomFieldForm[field.id]"
                                :required="field.isRequired"
                                class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                            
                            <!-- Select -->
                            <select
                                v-else-if="field.fieldType === 'select'"
                                v-model="localCustomFieldForm[field.id]"
                                :required="field.isRequired"
                                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option :value="null">Seleccionar...</option>
                                <option v-for="opt in getFieldOptions(field)" :key="opt" :value="opt">{{ opt }}</option>
                            </select>

                            <!-- Checkbox -->
                            <div v-else-if="field.fieldType === 'checkbox'" class="mt-2">
                                <label class="inline-flex items-center">
                                    <input type="checkbox" v-model="localCustomFieldForm[field.id]" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded">
                                    <span class="ml-2 text-sm text-gray-600">{{ field.fieldLabel }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-sm text-gray-400 italic text-center py-4">
                        No hay campos personalizados configurados.
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end pt-4 border-t border-gray-100">
                <button 
                    type="submit" 
                    :disabled="loading"
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {{ isEditing ? 'Guardar Cambios' : 'Crear Colaborador' }}
                </button>
            </div>
        </form>
    </div>
</template>
