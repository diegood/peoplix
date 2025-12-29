<script setup>
import { ref, computed, watch } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
  CREATE_COLLABORATOR, 
  UPDATE_COLLABORATOR,
  SET_CUSTOM_FIELD_VALUE 
} from '@/modules/Collaborators/graphql/collaborator.queries'
import { 
  X, User, Calendar, Laptop, Star 
} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

import CollaboratorGeneralTab from './tabs/CollaboratorGeneralTab.vue'
import CollaboratorSkillsTab from './tabs/CollaboratorSkillsTab.vue'
import CollaboratorHardwareTab from './tabs/CollaboratorHardwareTab.vue'
import CollaboratorHolidaysTab from './tabs/CollaboratorHolidaysTab.vue'
import CollaboratorAbsencesTab from './tabs/CollaboratorAbsencesTab.vue'
import CollaboratorScheduleTab from './tabs/CollaboratorScheduleTab.vue'

const props = defineProps({
  show: Boolean,
  collaborator: { type: Object, default: null }, // Null for create
  customFieldDefinitions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'saved'])
const notificationStore = useNotificationStore()

const { mutate: createCollaborator, loading: creating } = useMutation(CREATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: updateCollaborator, loading: updating } = useMutation(UPDATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: setCustomFieldValue } = useMutation(SET_CUSTOM_FIELD_VALUE, { refetchQueries: ['GetCollaborators'] })

const activeTab = ref('general')
const localCollaborator = ref(null)
const form = ref({
  userName: '',
  firstName: '',
  lastName: '',
  contractedHours: 40,
  joinDate: new Date().toISOString().split('T')[0],
  isActive: true,
  workCenterId: '',
  useCustomSchedule: false,
  workingSchedule: null
})
const customFieldForm = ref({})

const isEditing = computed(() => !!localCollaborator.value?.id)
const modalTitle = computed(() => isEditing.value ? 'Editar Colaborador' : 'Nuevo Colaborador')
const tabs = computed(() => [
  { id: 'general', label: 'General', icon: User },
  { id: 'skills', label: 'Skills', icon: Star, disabled: !isEditing.value },
  { id: 'hardware', label: 'Hardware', icon: Laptop, disabled: !isEditing.value },
  { id: 'holidays', label: 'Festivos', icon: Calendar, disabled: !isEditing.value },
  { id: 'absences', label: 'Ausencias', icon: Calendar, disabled: !isEditing.value },
  { id: 'schedule', label: 'Jornada', icon: Calendar, disabled: !isEditing.value },
])

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.collaborator) {
      localCollaborator.value = JSON.parse(JSON.stringify(props.collaborator))
      form.value = {
        userName: props.collaborator.userName || '',
        firstName: props.collaborator.firstName,
        lastName: props.collaborator.lastName,
        contractedHours: props.collaborator.contractedHours,
        joinDate: props.collaborator.joinDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        isActive: props.collaborator.isActive,
        workCenterId: props.collaborator.workCenter?.id || '',
        useCustomSchedule: props.collaborator.useCustomSchedule || false,
        workingSchedule: props.collaborator.workingSchedule ? 
            (typeof props.collaborator.workingSchedule === 'string' ? JSON.parse(props.collaborator.workingSchedule) : props.collaborator.workingSchedule) 
            : null
      }
      customFieldForm.value = {}
      props.customFieldDefinitions.forEach(def => {
        const val = getCustomFieldValue(props.collaborator, def.id)
        if (val !== undefined && val !== '') customFieldForm.value[def.id] = val
      })
    } else {
      resetForms()
    }
    activeTab.value = 'general'
  }
})

const resetForms = () => {
  localCollaborator.value = null
  form.value = {
    userName: '',
    firstName: '',
    lastName: '',
    contractedHours: 40,
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true,
    workCenterId: '',
    useCustomSchedule: false,
    workingSchedule: null
  }
  customFieldForm.value = {}
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
      const res = await updateCollaborator({ 
        id: localCollaborator.value.id,
        userName: form.value.userName || null,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        contractedHours: Number(form.value.contractedHours),
        joinDate: form.value.joinDate,
        isActive: form.value.isActive,
        workCenterId: form.value.workCenterId || null,
        workingSchedule: form.value.workingSchedule,
        useCustomSchedule: form.value.useCustomSchedule
      })
      savedCollaborator = res.data.updateCollaborator
      notificationStore.showToast('Colaborador actualizado', 'success')
    } else {
      const res = await createCollaborator({ 
        userName: form.value.userName || null,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        contractedHours: Number(form.value.contractedHours),
        joinDate: form.value.joinDate,
        workCenterId: form.value.workCenterId || null,
        workingSchedule: form.value.workingSchedule,
        useCustomSchedule: form.value.useCustomSchedule
      })
      savedCollaborator = res.data.createCollaborator
      localCollaborator.value = savedCollaborator
      notificationStore.showToast('Colaborador creado', 'success')
    }

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
        handleClose() 
    }
    
  } catch (err) {
    notificationStore.showToast(err.message || 'Error al guardar', 'error')
  }
}

const updateSkills = (newSkills) => {
    if (localCollaborator.value) {
        localCollaborator.value.skills = newSkills
    }
}

const updateHardware = (newHardware) => {
     if (localCollaborator.value) {
        localCollaborator.value.hardware = newHardware
    }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
      
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

      <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        
        <CollaboratorGeneralTab 
            v-if="activeTab === 'general'"
            v-model:form="form"
            v-model:customFieldForm="customFieldForm"
            :custom-field-definitions="customFieldDefinitions"
            :isEditing="isEditing"
            :loading="creating || updating"
            @save="handleSaveGeneral"
        />

        <CollaboratorSkillsTab
            v-else-if="activeTab === 'skills'"
            :collaboratorId="localCollaborator.id"
            :skills="localCollaborator.skills"
            @update:skills="updateSkills"
        />

        <CollaboratorHardwareTab
            v-else-if="activeTab === 'hardware'"
            :collaboratorId="localCollaborator.id"
            :hardware="localCollaborator.hardware"
            @update:hardware="updateHardware"
        />

        <CollaboratorHolidaysTab
             v-else-if="activeTab === 'holidays'"
             :workCenter="localCollaborator.workCenter"
             :collaboratorId="localCollaborator.id"
        />

        <CollaboratorAbsencesTab
             v-else-if="activeTab === 'absences'"
             :collaboratorId="localCollaborator.id"
             :workCenter="localCollaborator.workCenter"
             :vacationDaysPerYear="localCollaborator.vacationDaysPerYear"
        />

        <CollaboratorScheduleTab
             v-else-if="activeTab === 'schedule'"
             v-model:useCustomSchedule="form.useCustomSchedule"
             v-model:workingSchedule="form.workingSchedule"
             @save="handleSaveGeneral"
        />

      </div>
    </div>
  </div>
</template>
