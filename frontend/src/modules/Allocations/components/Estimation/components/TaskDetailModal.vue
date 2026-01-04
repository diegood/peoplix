<script setup>
import { ref, watch } from 'vue'
import { X, AlignLeft, List, Trash } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import TiptapEditor from '@/modules/Kanban/components/TiptapEditor.vue'
import SimpleTabs from '@/components/SimpleTabs.vue'
import { useEstimationMutations } from '../useEstimationMutations'

const notificationStore = useNotificationStore()

const props = defineProps({
  isOpen: Boolean,
  task: Object,
  availableRoles: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'refetch'])

const { updateTask, estimateTask, deleteTask } = useEstimationMutations(null)

const localTask = ref({})

const tabs = [
    { id: 'details', label: 'Detalles' }
]
const activeTab = ref('details')

watch(() => props.task, (newTask) => {
    if (newTask) {
        localTask.value = JSON.parse(JSON.stringify(newTask))
    }
}, { immediate: true, deep: true })

const handleDelete = async () => {
    if(await notificationStore.showDialog('¿Seguro que deseas eliminar esta tarea?', 'Eliminar Tarea')) {
        try {
            await deleteTask({ id: localTask.value.id })
            emit('refetch')
            emit('close')
            notificationStore.showToast('Tarea eliminada', 'success')
        } catch(e) {
            console.error(e)
            notificationStore.showToast('Error al eliminar tarea', 'error')
        }
    }
}

const handleDescriptionSave = async () => {
    try {
        await updateTask({ id: localTask.value.id, description: localTask.value.description })
        emit('refetch')
    } catch (e) {
        console.error('Failed to save description', e)
        notificationStore.showToast('Error al guardar descripción', 'error')
    }
}

const handleTitleSave = async () => {
     try {
        await updateTask({ id: localTask.value.id, name: localTask.value.name })
        emit('refetch')
    } catch (e) {
        console.error('Failed to save title', e)
        notificationStore.showToast('Error al guardar título', 'error')
    }
}

const newEstimationRole = ref('')
const newEstimationHours = ref(0)

const handleAddEstimation = async () => {
    if (!newEstimationRole.value || newEstimationHours.value <= 0) return
    
    try {
        await estimateTask({
            taskId: localTask.value.id,
            roleId: newEstimationRole.value,
            hours: parseFloat(newEstimationHours.value)
        })
        emit('refetch')
        const role = props.availableRoles.find(r => r.id === newEstimationRole.value)
        if (!localTask.value.estimations) localTask.value.estimations = []
        localTask.value.estimations.push({
            id: 'temp-' + Date.now(),
            role: role,
            hours: parseFloat(newEstimationHours.value),
            collaborator: null
        })
        newEstimationRole.value = ''
        newEstimationHours.value = 0
        notificationStore.showToast('Estimación agregada', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al agregar estimación', 'error')
    }
}

const updateEstimation = async (est, field, value) => {
     try {
        const payload = {
            taskId: localTask.value.id,
            roleId: est.role.id,
            hours: field === 'hours' ? parseFloat(value) : est.hours,
            collaboratorId: field === 'collaboratorId' ? value : (est.collaborator?.id || null) 
        }
        await estimateTask(payload)
        emit('refetch')
     } catch (e) {
         console.error(e)
         notificationStore.showToast('Error al actualizar estimación', 'error')
     }
}

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="px-6 py-4 border-b flex justify-between items-start bg-gray-50">
             <div class="flex-1">
                 <div class="mb-2">
                      <input 
                        v-model="localTask.name" 
                        @blur="handleTitleSave"
                        class="text-xl font-bold text-gray-900 bg-transparent outline-none w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors"
                      />
                 </div>
                 <div class="text-xs text-gray-500">
                     {{ localTask.workPackage?.name || 'Sin Paquete' }}
                 </div>
             </div>
             <button @click="handleDelete" class="text-red-400 hover:text-red-600 transition-colors mr-2">
                 <Trash size="20" />
             </button>
             <button @click="$emit('close')" class="text-gray-400 hover:text-gray-700 transition-colors">
                 <X size="24" />
             </button>
          </div>
          
          <SimpleTabs :tabs="tabs" @change="id => activeTab = id" class="px-6" />

          <div class="flex-1 flex overflow-hidden">
              <div class="flex-1 p-6 overflow-y-auto w-2/3 border-r border-gray-100">
                  
                  <div v-if="activeTab === 'details'" class="animate-in fade-in duration-200">
                      <div class="mb-8">
                           <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                               <AlignLeft size="16"/> Descripción
                           </h3>
                           <div class="h-64 flex flex-col">
                              <TiptapEditor 
                                v-model="localTask.description" 
                                @blur="handleDescriptionSave"
                                class="h-full"
                              />
                           </div>
                      </div>

                      <div class="mb-8">
                          <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                              <List size="16"/> Subtareas / Estimaciones ({{ localTask.estimations?.length || 0 }})
                          </h3>
                          
                          <div class="mb-4 flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                              <select v-model="newEstimationRole" class="flex-1 text-sm border-gray-200 rounded px-2 py-1.5 bg-white outline-none">
                                  <option value="" disabled selected>Seleccionar Rol...</option>
                                  <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                                      {{ role.name }}
                                  </option>
                              </select>
                              <input 
                                  v-model.number="newEstimationHours"
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  placeholder="Horas" 
                                  class="w-20 text-sm border-gray-200 rounded px-2 py-1.5 bg-white outline-none"
                              />
                              <button @click="handleAddEstimation" class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50" :disabled="!newEstimationRole || newEstimationHours <= 0">
                                  +
                              </button>
                          </div>

                          <div v-if="localTask.estimations?.length" class="space-y-2">
                              <div v-for="est in localTask.estimations" :key="est.id" class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white">
                                  <div class="flex-1 font-medium text-sm text-gray-700">
                                      {{ est.role?.name || 'Rol Desconocido' }}
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        :value="est.hours" 
                                        @change="(e) => updateEstimation(est, 'hours', e.target.value)"
                                        class="w-16 text-right text-sm border rounded px-1 py-0.5 outline-none focus:border-blue-500"
                                      />
                                      <span class="text-xs text-gray-500">h</span>
                                  </div>
                              </div>
                          </div>
                          <div v-else class="text-center py-4 text-gray-400 text-sm">
                              No hay estimaciones definidas
                          </div>
                      </div>
                  </div>
              </div>

              <div class="w-1/3 bg-gray-50 p-6 overflow-y-auto">
                  <h3 class="text-xs font-bold text-gray-500 uppercase mb-4">Detalles</h3>
                  
                  <div class="space-y-4">
                      <div>
                          <label class="text-xs text-gray-400 block mb-1">Total Horas</label>
                          <div class="text-2xl font-bold text-gray-800">
                              {{ localTask.estimations?.reduce((acc, curr) => acc + curr.hours, 0) || 0 }}h
                          </div>
                      </div>
                      
                      <div>
                           <label class="text-xs text-gray-400 block mb-1">Fechas</label>
                           <div class="text-sm text-gray-600">
                               <div>Inicio: {{ localTask.startDate ? new Date(parseInt(localTask.startDate)).toLocaleDateString() : '-' }}</div>
                               <div>Fin: {{ localTask.endDate ? new Date(parseInt(localTask.endDate)).toLocaleDateString() : '-' }}</div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>
