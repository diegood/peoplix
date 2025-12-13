<script setup>
import { ref, computed, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
  CREATE_COLLABORATOR, 
  UPDATE_COLLABORATOR,
  ADD_COLLABORATOR_SKILL, 
  REMOVE_COLLABORATOR_SKILL,
  ADD_HARDWARE,
  REMOVE_HARDWARE,
  UPDATE_HOLIDAY_CALENDAR,
  SET_CUSTOM_FIELD_VALUE 
} from '@/graphql/queries'
import { 
  X, User, Briefcase, Calendar, Laptop, Star, Save, Plus, 
  Trash2, AlertCircle 
} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import SkillSelector from './SkillSelector.vue'

const props = defineProps({
  show: Boolean,
  collaborator: { type: Object, default: null }, // Null for create
  customFieldDefinitions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'saved'])
const notificationStore = useNotificationStore()

// Mutations
const { mutate: createCollaborator } = useMutation(CREATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: updateCollaborator } = useMutation(UPDATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: addSkill } = useMutation(ADD_COLLABORATOR_SKILL, { refetchQueries: ['GetCollaborators'] })
const { mutate: removeSkill } = useMutation(REMOVE_COLLABORATOR_SKILL, { refetchQueries: ['GetCollaborators'] })
const { mutate: addHardware } = useMutation(ADD_HARDWARE, { refetchQueries: ['GetCollaborators'] })
const { mutate: removeHardware } = useMutation(REMOVE_HARDWARE, { refetchQueries: ['GetCollaborators'] })
const { mutate: updateHolidayCalendar } = useMutation(UPDATE_HOLIDAY_CALENDAR, { refetchQueries: ['GetCollaborators'] })
const { mutate: setCustomFieldValue } = useMutation(SET_CUSTOM_FIELD_VALUE, { refetchQueries: ['GetCollaborators'] })

// State
const activeTab = ref('general')
const localCollaborator = ref(null) // Keeps track of the collaborator being edited (either from props or just created)
const form = ref({
  userName: '',
  firstName: '',
  lastName: '',
  contractedHours: 40,
  joinDate: new Date().toISOString().split('T')[0],
  isActive: true
})
const customFieldForm = ref({}) // Stores values for custom fields (fieldId -> value)

// Sub-forms state
const newSkillForm = ref({ name: '', level: '1', id: null })
const newHardwareForm = ref({ name: '', type: 'Laptop', serialNumber: '' })
const holidayForm = ref({ year: new Date().getFullYear(), holidays: [] })
const newHolidayDate = ref('')
const addingSkill = ref(false)
const addingHardware = ref(false)

// Computed
const isEditing = computed(() => !!localCollaborator.value?.id)
const modalTitle = computed(() => isEditing.value ? 'Editar Colaborador' : 'Nuevo Colaborador')
const tabs = computed(() => [
  { id: 'general', label: 'General', icon: User },
  { id: 'skills', label: 'Skills', icon: Star, disabled: !isEditing.value },
  { id: 'hardware', label: 'Hardware', icon: Laptop, disabled: !isEditing.value },
  { id: 'holidays', label: 'Festivos', icon: Calendar, disabled: !isEditing.value },
])

// Watchers
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.collaborator) {
      // Edit Mode
      localCollaborator.value = JSON.parse(JSON.stringify(props.collaborator))
      form.value = {
        userName: props.collaborator.userName || '',
        firstName: props.collaborator.firstName,
        lastName: props.collaborator.lastName,
        contractedHours: props.collaborator.contractedHours,
        joinDate: props.collaborator.joinDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        isActive: props.collaborator.isActive
      }
      // Populate custom fields form
      customFieldForm.value = {}
      props.customFieldDefinitions.forEach(def => {
        const val = getCustomFieldValue(props.collaborator, def.id)
        if (val !== undefined && val !== '') customFieldForm.value[def.id] = val
      })
      
      holidayForm.value = {
        year: props.collaborator.holidayCalendar?.year || new Date().getFullYear(),
        holidays: [...(props.collaborator.holidayCalendar?.holidays || [])]
      }
    } else {
      // Create Mode
      resetForms()
    }
    activeTab.value = 'general'
  }
})

// Helpers
const resetForms = () => {
  localCollaborator.value = null
  form.value = {
    userName: '',
    firstName: '',
    lastName: '',
    contractedHours: 40,
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true
  }
  customFieldForm.value = {}
  newSkillForm.value = { name: '', level: '1', id: null }
  newHardwareForm.value = { name: '', type: 'Laptop', serialNumber: '' }
  holidayForm.value = { year: new Date().getFullYear(), holidays: [] }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES')
}

const getCustomFieldValue = (collab, fieldDefId) => {
  const field = collab.customFields?.find(f => f.fieldDefinitionId === fieldDefId)
  if (!field) return ''
  try {
    return JSON.parse(field.value)
  } catch {
    return field.value
  }
}

// Actions
const handleClose = () => {
  emit('close')
}

const handleSaveGeneral = async () => {
  if (!form.value.firstName || !form.value.lastName) {
    notificationStore.showToast('Nombre y Apellidos son obligatorios', 'error')
    return
  }

  try {
    let savedCollaborator
    
    if (isEditing.value) {
      // Update
      const res = await updateCollaborator({ 
        id: localCollaborator.value.id,
        userName: form.value.userName || null,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        contractedHours: Number(form.value.contractedHours),
        joinDate: form.value.joinDate,
        isActive: form.value.isActive
      })
      savedCollaborator = res.data.updateCollaborator
      notificationStore.showToast('Colaborador actualizado', 'success')
    } else {
      // Create
      const res = await createCollaborator({ 
        userName: form.value.userName || null,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        contractedHours: Number(form.value.contractedHours),
        joinDate: form.value.joinDate
      })
      savedCollaborator = res.data.createCollaborator
      localCollaborator.value = savedCollaborator // Enable other tabs
      notificationStore.showToast('Colaborador creado', 'success')
    }

    // Save Custom Fields
    // We do this immediately after save for both create and update to ensure consistency
    if (savedCollaborator && savedCollaborator.id) {
       for (const [fieldId, value] of Object.entries(customFieldForm.value)) {
           if (value !== undefined && value !== null && value !== '') {
               await setCustomFieldValue({
                  collaboratorId: savedCollaborator.id,
                  fieldDefinitionId: fieldId,
                  value: JSON.stringify(value)
               })
           }
       }
    }
    
    emit('saved', savedCollaborator)
    if (!isEditing.value) {
        // If it was a create action, we're now in edit mode for this user
        // We could close, but maybe user wants to add skills immediately?
        // Let's close for now as per standard UX, or keep open? 
        // User asked "Custom fields appear in creation form", which we handled.
        // Let's emit saved and close.
        handleClose() 
    }
    
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al guardar', 'error')
  }
}

// Skills Logic
const handleSkillSelect = (skill) => {
  newSkillForm.value.id = skill.id
  newSkillForm.value.name = skill.name
}

const onSaveSkill = async () => {
  if (!newSkillForm.value.id) {
     notificationStore.showToast("Selecciona un skill", "error")
     return
  }
  try {
    await addSkill({
      collaboratorId: localCollaborator.value.id,
      skillId: newSkillForm.value.id,
      level: parseInt(newSkillForm.value.level)
    })
    addingSkill.value = false
    newSkillForm.value = { name: '', level: '1', id: null }
    notificationStore.showToast("Skill agregado", "success")
  } catch(e) {
    notificationStore.showToast(e.message, "error")
  }
}

const onRemoveSkill = async (skillId) => {
    try {
        await removeSkill({ collaboratorId: localCollaborator.value.id, skillId })
        notificationStore.showToast("Skill eliminado", "success")
    } catch(e) {
        notificationStore.showToast(e.message, "error")
    }
}

// Hardware Logic
const onSaveHardware = async () => {
  if (!newHardwareForm.value.name) return
  try {
    await addHardware({
      collaboratorId: localCollaborator.value.id,
      name: newHardwareForm.value.name,
      type: newHardwareForm.value.type,
      serialNumber: newHardwareForm.value.serialNumber || null
    })
    addingHardware.value = false
    newHardwareForm.value = { name: '', type: 'Laptop', serialNumber: '' }
    notificationStore.showToast('Hardware agregado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message, 'error')
  }
}

const onRemoveHardware = async (hwId) => {
    try {
        await removeHardware({ id: hwId })
        notificationStore.showToast('Hardware eliminado', 'success')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

// Holiday Logic
const addHolidayDate = () => {
  if (newHolidayDate.value && !holidayForm.value.holidays.includes(newHolidayDate.value)) {
    holidayForm.value.holidays.push(newHolidayDate.value)
    holidayForm.value.holidays.sort()
    newHolidayDate.value = ''
  }
}
const removeHolidayDate = (date) => {
  holidayForm.value.holidays = holidayForm.value.holidays.filter(d => d !== date)
}
const onSaveHolidays = async () => {
  try {
    await updateHolidayCalendar({
      collaboratorId: localCollaborator.value.id,
      year: Number(holidayForm.value.year),
      holidays: holidayForm.value.holidays
    })
    notificationStore.showToast('Calendario actualizado', 'success')
  } catch (err) {
    notificationStore.showToast(err.message, 'error')
  }
}

</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
      
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <User size="20" />
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-800">{{ modalTitle }}</h2>
                <p class="text-xs text-gray-500">Gestión de información del colaborador</p>
            </div>
        </div>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors">
          <X size="20" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-100 px-4 pt-2 gap-1 overflow-x-auto">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="!tab.disabled && (activeTab = tab.id)"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
          :class="[
            activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          ]"
          :disabled="tab.disabled"
        >
          <component :is="tab.icon" size="16" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        
        <!-- Tab: General -->
        <div v-if="activeTab === 'general'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <!-- Basic Info -->
                 <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                     <h3 class="font-bold text-gray-700 text-sm flex items-center gap-2 mb-3">
                        <User size="16" class="text-blue-500"/> Información Básica
                     </h3>
                     
                     <div class="grid grid-cols-2 gap-3">
                         <div class="col-span-2">
                             <label class="block text-xs font-medium text-gray-500 mb-1">Nombre de Usuario</label>

    <!-- Replaced input-base with utilities -->
    <input v-model="form.userName" type="text" placeholder="@usuario" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         </div>
                         <div>
                             <label class="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                             <input v-model="form.firstName" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         </div>
                         <div>
                             <label class="block text-xs font-medium text-gray-500 mb-1">Apellidos *</label>
                             <input v-model="form.lastName" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         </div>
                         <div>
                             <label class="block text-xs font-medium text-gray-500 mb-1">Horas/Semana</label>
                             <input v-model="form.contractedHours" type="number" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         </div>
                         <div>
                             <label class="block text-xs font-medium text-gray-500 mb-1">Fecha Ingreso</label>
                             <input v-model="form.joinDate" type="date" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                         </div>
                         <div class="col-span-2 flex items-center gap-2 pt-2">
                             <label class="flex items-center gap-2 cursor-pointer select-none">
                                 <input type="checkbox" v-model="form.isActive" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                 <span class="text-sm text-gray-700">Activo en el sistema</span>
                             </label>
                         </div>
                     </div>
                 </div>

                 <!-- Custom Fields -->
                 <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                     <h3 class="font-bold text-gray-700 text-sm flex items-center gap-2 mb-3">
                        <Briefcase size="16" class="text-purple-500"/> Detalles Adicionales
                     </h3>
                     
                     <div v-if="customFieldDefinitions.length" class="space-y-3">
                         <div v-for="field in customFieldDefinitions" :key="field.id">
                             <label class="block text-xs font-medium text-gray-500 mb-1">{{ field.fieldLabel }}</label>
                             <input 
                                v-if="field.fieldType === 'text'"
                                v-model="customFieldForm[field.id]" 
                                type="text" 
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                             />
                             <input 
                                v-else-if="field.fieldType === 'number'"
                                v-model="customFieldForm[field.id]" 
                                type="number" 
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                             />
                             <input 
                                v-else-if="field.fieldType === 'date'"
                                v-model="customFieldForm[field.id]" 
                                type="date" 
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                             />
                              <select 
                                v-else-if="field.fieldType === 'select'"
                                v-model="customFieldForm[field.id]" 
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                             >
                                <option value="">Seleccionar...</option>
                                <option v-for="opt in JSON.parse(field.fieldConfig || '[]')" :key="opt" :value="opt">{{ opt }}</option>
                             </select>
                         </div>
                     </div>
                     <div v-else class="text-sm text-gray-400 italic text-center py-4">
                         No hay campos personalizados configurados.
                     </div>
                 </div>
            </div>
            
            <div class="flex justify-end pt-4 border-t border-gray-100">
                <button @click="handleSaveGeneral" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow flex items-center gap-2">
                    <Save size="16" />
                    {{ isEditing ? 'Guardar Cambios' : 'Crear Colaborador' }}
                </button>
            </div>
        </div>

        <!-- Tab: Skills -->
        <div v-else-if="activeTab === 'skills'" class="space-y-4">
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Competencias y Habilidades</h3>
                    <button @click="addingSkill = !addingSkill" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors text-xs flex items-center gap-1">
                        <Plus size="14" /> Agregar Skill
                    </button>
                </div>
                
                <div v-if="addingSkill" class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div class="flex items-end gap-2">
                        <div class="flex-1">
                            <label class="text-xs text-blue-700 font-medium mb-1 block">Skill</label>
                            <SkillSelector 
                                v-model="newSkillForm.name" 
                                @select="handleSkillSelect"
                                placeholder="Buscar..." 
                                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                            />
                        </div>
                        <div class="w-24">
                            <label class="text-xs text-blue-700 font-medium mb-1 block">Nivel (1-4)</label>
                            <select v-model="newSkillForm.level" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
                                <option value="1">L1 - Junior</option>
                                <option value="2">L2 - Mid</option>
                                <option value="3">L3 - Senior</option>
                                <option value="4">L4 - Lead</option>
                            </select>
                        </div>
                        <button @click="onSaveSkill" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow mb-[1px]">Guardar</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div v-for="skillRel in localCollaborator.skills" :key="skillRel.id" 
                         class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                        <div>
                            <div class="font-bold text-gray-700">{{ skillRel.skill.name }}</div>
                            <div class="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                Nivel {{ skillRel.level }}
                            </div>
                        </div>
                        <button @click="onRemoveSkill(skillRel.skill.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size="16" />
                        </button>
                    </div>
                    <div v-if="!localCollaborator.skills?.length" class="col-span-full text-center py-8 text-gray-400 italic">
                        No hay skills asignados aún.
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Hardware -->
        <div v-else-if="activeTab === 'hardware'" class="space-y-4">
             <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Inventario de Hardware</h3>
                    <button @click="addingHardware = !addingHardware" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors text-xs flex items-center gap-1">
                        <Plus size="14" /> Asignar Equipo
                    </button>
                </div>

                <div v-if="addingHardware" class="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                    <div class="grid grid-cols-3 gap-2 align-end">
                        <div class="col-span-3 md:col-span-1">
                            <input v-model="newHardwareForm.name" placeholder="Nombre (ej. MacBook Pro)" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                        </div>
                        <div>
                             <select v-model="newHardwareForm.type" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
                                <option>Laptop</option>
                                <option>Monitor</option>
                                <option>Phone</option>
                                <option>Tablet</option>
                                <option>Keyboard</option>
                                <option>Mouse</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                             <input v-model="newHardwareForm.serialNumber" placeholder="Serial No." class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
                             <button @click="onSaveHardware" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow">Guardar</button>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <div v-for="hw in localCollaborator.hardware" :key="hw.id" 
                         class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-gray-100 text-gray-500 rounded">
                                <Laptop size="18" />
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">{{ hw.name }}</div>
                                <div class="text-xs text-gray-500 flex gap-2">
                                    <span>{{ hw.type }}</span>
                                    <span v-if="hw.serialNumber" class="text-gray-400">#{{ hw.serialNumber }}</span>
                                </div>
                            </div>
                        </div>
                        <button @click="onRemoveHardware(hw.id)" class="text-gray-300 hover:text-red-500">
                            <Trash2 size="16" />
                        </button>
                    </div>
                    <div v-if="!localCollaborator.hardware?.length" class="text-center py-8 text-gray-400 italic">
                        Sin hardware asignado.
                    </div>
                </div>
             </div>
        </div>

        <!-- Tab: Holidays -->
        <div v-else-if="activeTab === 'holidays'" class="space-y-4">
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Calendario de Festivos Personales</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">Año:</span>
                        <input v-model="holidayForm.year" type="number" class="w-20 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all !py-1" />
                    </div>
                </div>
                
                <div class="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
                    <AlertCircle size="14" class="mt-0.5" />
                    <p>Estos días se restarán automáticamente de la capacidad del colaborador para las asignaciones.</p>
                </div>

                <div class="flex gap-2 mb-4">
                    <input v-model="newHolidayDate" type="date" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all flex-1" />
                    <button @click="addHolidayDate" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">Agregar Fecha</button>
                </div>
                
                <div class="flex-1 overflow-y-auto border rounded-lg p-2 min-h-[200px] bg-gray-50">
                    <div class="flex flex-wrap gap-2">
                        <div v-for="date in holidayForm.holidays" :key="date" 
                             class="bg-white border border-blue-100 text-blue-700 text-xs px-2 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                             <Calendar size="12" class="text-blue-400"/>
                             {{ formatDate(date) }}
                             <button @click="removeHolidayDate(date)" class="text-blue-300 hover:text-red-500">
                                 <X size="12" />
                             </button>
                        </div>
                        <span v-if="!holidayForm.holidays.length" class="text-gray-400 italic text-xs w-full text-center py-4">
                            No hay fechas seleccionadas para este año.
                        </span>
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button @click="onSaveHolidays" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow">
                        Guardar Calendario
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

