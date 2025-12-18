<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 bg-gray-50 flex justify-between items-center cursor-pointer" @click="toggleExpand">
          <div class="flex items-center gap-3">
              <button class="text-gray-400">
                  <ChevronDown v-if="isExpanded" size="20"/>
                  <ChevronRight v-else size="20" />
              </button>
              <div>
                  <h4 class="font-bold text-gray-800">{{ wp.name }}</h4>
                  <span class="text-xs text-gray-500" v-if="wp.highLevelEstimation">Estimación Alta: {{ wp.highLevelEstimation }}h</span>
                  <span class="text-gray-300 mx-2">|</span>
                  <input type="date" 
                         :value="formatDate(wp.startDate)" 
                         @change="handleUpdateWPDate"
                         @click.stop
                         class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
          </div>
          <div class="flex items-center gap-4">
               <div class="text-sm font-medium text-gray-600">
                   {{ wp.tasks?.reduce((acc, t) => acc + (t.estimations?.reduce((a,e)=>a+e.hours,0) || 0), 0) }}h
               </div>
              <button @click.stop="handleDeleteWP" class="text-red-400 hover:text-red-600">
                  <Trash size="18" />
              </button>
          </div>
      </div>

      <div v-show="isExpanded" class="p-4 border-t border-gray-100">
          <table class="w-full text-sm">
              <thead>
                  <tr class="text-left text-gray-500 border-b">
                       <th class="pb-2 pl-2">Tarea</th>
                       <th v-for="role in roleColumns" :key="role.id" class="pb-2 w-24 text-center">{{ role.name }} (h)</th>
                       <th class="py-2 px-2 text-left font-medium text-gray-500 w-48">Dependencias</th>
                       <th class="py-2 px-2 text-center w-10"></th>
                       <th class="pb-2 w-10"></th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="task in wp.tasks" :key="task.id" class="border-b border-gray-50 hover:bg-gray-50">
                       <td class="py-2 pl-2 font-medium relative group">
                           <div class="flex items-center gap-2">
                               <button @click="descriptionEditing = descriptionEditing === task.id ? null : task.id" 
                                       class="text-gray-400 hover:text-blue-600 transition-colors"
                                       :class="{'text-blue-600': task.description}">
                                   <FileText :size="14" />
                               </button>

                               <input :value="task.name" 
                                      class="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-gray-700"
                                      @change="(e) => handleUpdateTaskName(task.id, e.target.value)" />
                           </div>
                       </td>

                       <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center relative">
                           <div class="flex items-center justify-center gap-1 group">
                               <!-- Collaborator Button (Only if hours > 0 or hover? Let's show always for visibility or just small) -->
                               <!-- Using a helper to get estimation simplifies template -->
                               <div class="relative">
                                    <button 
                                        @click="openAssignmentModal(task, role)"
                                        class="w-6 h-6 rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-gray-200"
                                        :class="getEst(task, role.id)?.collaborator ? 'bg-white' : 'text-gray-300 hover:text-blue-500'"
                                        title="Asignar colaborador"
                                    >
                                        <template v-if="getEst(task, role.id)?.collaborator">
                                            <img v-if="getEst(task, role.id).collaborator.avatar" 
                                                 :src="getEst(task, role.id).collaborator.avatar" 
                                                 class="w-5 h-5 rounded-full object-cover" />
                                            <div v-else class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-bold">
                                                {{ getEst(task, role.id).collaborator.firstName[0] }}{{ getEst(task, role.id).collaborator.lastName[0] }}
                                            </div>
                                        </template>
                                        <User v-else :size="14" />
                                    </button>
                               </div>

                               <input 
                                   type="number" 
                                   min="0"
                                   class="w-16 border rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                                   :value="getEst(task, role.id)?.hours || 0"
                                   @change="(e) => handleUpdateEst(task.id, role.id, e.target.value)"
                               />
                           </div>
                       </td>
                       <td class="py-2 px-2 text-center w-48 align-top">
                           <div class="flex flex-col gap-1 items-start">
                               <div v-for="dep in task.dependencies" :key="dep.id" 
                                    class="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 w-full justify-between">
                                   <span class="truncate max-w-[100px]" :title="dep.name">{{ dep.name }}</span>
                                   <button @click="handleRemoveDependency(task.id, dep.id)" class="text-orange-400 hover:text-red-500"><X size="10"/></button>
                               </div>
                               
                               <div v-if="addingDepFor !== task.id" class="w-full">
                                   <button @click="addingDepFor = task.id" class="text-gray-400 hover:text-blue-500 text-xs flex items-center gap-1">
                                       <Link size="12" /> Link
                                   </button>
                               </div>
                               
                               <div v-else class="flex items-center gap-1 w-full">
                                   <select class="w-full text-[10px] border rounded py-0.5" 
                                           @change="(e) => handleAddDependency(task.id, e.target.value)"
                                           @blur="addingDepFor = null">
                                       <option value="">Select...</option>
                                       <option v-for="t in wp.tasks.filter(t => t.id !== task.id)" :key="t.id" :value="t.id">
                                           {{ t.name }}
                                       </option>
                                   </select>
                               </div>
                           </div>
                       </td>
                       <td class="py-2 px-2 text-center w-10">
                            <button @click="handleDeleteTask(task.id)" class="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash :size="14" />
                            </button>
                       </td>
                       <td class="py-2 text-center text-gray-400">
                       </td>
                  </tr>
                  <tr class="bg-gray-50/50">
                       <td class="py-3 pl-2">
                           <input placeholder="+ Nueva tarea..." 
                                  class="w-full bg-transparent border-none outline-none text-gray-600 placeholder-gray-400 focus:ring-0" 
                                  v-model="draftName"
                                  @keydown.enter="handleSaveDraft" 
                           />
                       </td>
                       <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center">
                            <input 
                               type="number" 
                               min="0"
                               placeholder="-"
                               class="w-16 border border-gray-200 rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none bg-white"
                               v-model="draftEstimations[role.id]"
                               @keydown.enter="handleSaveDraft"
                           />
                       </td>
                       <td class="py-2 text-center">
                           <button v-if="draftName" @click="handleSaveDraft" class="text-blue-600 text-xs font-bold hover:underline">
                               Guardar
                           </button>
                       </td>
                       <td></td>
                  </tr>
              </tbody>
          </table>
      </div>
      <CollaboratorAssignmentModal 
         v-if="assignmentModalOpen"
         :isOpen="assignmentModalOpen"
         :roleId="assignmentContext.roleId"
         :roleName="assignmentContext.roleName"
         :currentCollaboratorId="assignmentContext.currentCollaboratorId"
         :projectAllocations="projectAllocations"
         @close="assignmentModalOpen = false"
         @select="handleAssignmentSelect"
      />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue' // Added computed
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
    CREATE_TASK, 
    UPDATE_TASK, 
    UPDATE_WORK_PACKAGE, 
    ESTIMATE_TASK, 
    DELETE_WORK_PACKAGE, 
    ADD_TASK_DEPENDENCY, 
    REMOVE_TASK_DEPENDENCY,
    DELETE_TASK
} from '@/graphql/mutations'
import { GET_COLLABORATORS } from '@/graphql/queries'
import { Trash, ChevronDown, ChevronRight, Link, X, User, FileText, Search } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'
import { useNotificationStore } from '@/stores/notificationStore'
import { parseDateSafe, formatDate, addBusinessDays } from '@/helper/Date'

import CollaboratorAssignmentModal from './CollaboratorAssignmentModal.vue'

const props = defineProps({
  wp: { type: Object, required: true },
  roleColumns: { type: Array, required: true },
  initiallyExpanded: { type: Boolean, default: false },
  projectCollaborators: { type: Array, default: () => [] },
  projectAllocations: { type: Array, default: () => [] } 
})

const emit = defineEmits(['refetch'])

const notificationStore = useNotificationStore()
const isExpanded = ref(props.initiallyExpanded)
const toggleExpand = () => isExpanded.value = !isExpanded.value

const addingDepFor = ref(null)
const descriptionEditing = ref(null) // taskId
const draftName = ref('')
const draftEstimations = ref({})

// Modal State
const assignmentModalOpen = ref(false)
const assignmentContext = ref({
    task: null,
    roleId: null,
    roleName: '',
    currentCollaboratorId: null
})

const openAssignmentModal = (task, role) => {
    const est = getEst(task, role.id)
    assignmentContext.value = {
        task,
        roleId: role.id,
        roleName: role.name,
        currentCollaboratorId: est?.collaborator?.id || null
    }
    assignmentModalOpen.value = true
}

const handleAssignmentSelect = (collab) => {
    if (assignmentContext.value.task) {
        handleUpdateEstCollaborator(
            assignmentContext.value.task, 
            assignmentContext.value.roleId, 
            collab?.id || null
        )
    }
    assignmentModalOpen.value = false
}

const { mutate: updateTask } = useMutation(UPDATE_TASK)
const { mutate: estimateTask } = useMutation(ESTIMATE_TASK)
const { mutate: deleteWorkPackage } = useMutation(DELETE_WORK_PACKAGE)
const { mutate: updateWorkPackage } = useMutation(UPDATE_WORK_PACKAGE)
const { mutate: createTask } = useMutation(CREATE_TASK)
const { mutate: addTaskDependency } = useMutation(ADD_TASK_DEPENDENCY)
const { mutate: removeTaskDependency } = useMutation(REMOVE_TASK_DEPENDENCY)
const { mutate: deleteTask } = useMutation(DELETE_TASK)

const handleUpdateTaskName = async (id, name) => {
    try {
        await updateTask({ id, name })
    } catch (e) {
        console.error(e)
    }
}

const handleUpdateEst = async (taskId, roleId, hoursStr) => {
    try {
        const hours = parseFloat(hoursStr) || 0
        
        let startDateStr = undefined
        let endDateStr = undefined
        
        if (hours > 0) {
             let lastEndDateForRole = null
             const taskIndex = props.wp.tasks.findIndex(t => t.id === taskId)
             
             if (taskIndex >= 0) {
                 for (let i = taskIndex - 1; i >= 0; i--) {
                     const t = props.wp.tasks[i]
                     const prevEst = t.estimations?.find(e => e.role.id === roleId)
                     if (prevEst) {
                         if (prevEst.endDate) {
                             lastEndDateForRole = parseDateSafe(prevEst.endDate)
                             break
                         }
                         if (prevEst.startDate) {
                             lastEndDateForRole = parseDateSafe(prevEst.startDate)
                             break
                         }
                     }
                 }
             }
             
             let estStart
             if (lastEndDateForRole) {
                 estStart = lastEndDateForRole
             } else {
                 const parsedWPDate = parseDateSafe(props.wp?.startDate)
                 estStart = parsedWPDate && parsedWPDate.isValid() ? parsedWPDate : dayjs().startOf('day')
             }
             
             // Ensure start date is a business day
             while (estStart.day() === 0 || estStart.day() === 6) {
                 estStart = estStart.add(1, 'day')
             }
             
             const days = hours / 3
             const estEnd = addBusinessDays(estStart, days)
             
             startDateStr = estStart.format('YYYY-MM-DD HH:mm')
             endDateStr = estEnd.format('YYYY-MM-DD HH:mm')
        }

        await estimateTask({ 
            taskId, 
            roleId, 
            hours,
            startDate: startDateStr,
            endDate: endDateStr
        })
        emit('refetch')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al actualizar estimación', 'error')
    }
}

const handleDeleteWP = async () => {
    if (confirm('¿Eliminar funcionalidad y todas sus tareas?')) {
        await deleteWorkPackage({ id: props.wp.id })
        emit('refetch')
    }
}

const handleUpdateWPDate = async (e) => {
    const date = e.target.value
    if (!date) return
    try {
        await updateWorkPackage({ id: props.wp.id, name: props.wp.name, startDate: date })
        emit('refetch')
    } catch(err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const handleAddDependency = async (taskId, predecessorId) => {
    if (!predecessorId) return
    try {
        await addTaskDependency({ taskId, predecessorId })
        addingDepFor.value = null
        emit('refetch')
    } catch (e) {
         notificationStore.showToast(e.message, 'error')
    }
}

const handleRemoveDependency = async (taskId, predecessorId) => {
    try {
        await removeTaskDependency({ taskId, predecessorId })
        emit('refetch')
    } catch (e) {
         console.error(e)
    }
}

const handleDeleteTask = async (taskId) => {
    if (confirm('¿Eliminar tarea?')) {
        try {
            await deleteTask({ id: taskId })
            emit('refetch')
            notificationStore.showToast('Tarea eliminada', 'success')
        } catch (e) {
            console.error(e)
            notificationStore.showToast('Error al eliminar tarea', 'error')
        }
    }
}



const handleUpdateTaskDesc = async (taskId, description) => {
    try {
        await updateTask({ id: taskId, description })
        emit('refetch')
        descriptionEditing.value = null
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al actualizar descripción', 'error')
    }
}



// Helper to get estimation
const getEst = (task, roleId) => task.estimations?.find(e => e.role.id === roleId)

const handleUpdateEstCollaborator = async (task, roleId, collaboratorId) => {
    try {
        const est = getEst(task, roleId)
        const hours = est?.hours || 0
        
        let startDate = est?.startDate
        let endDate = est?.endDate

        // Ensure dates are strings and valid
        if (startDate && typeof startDate === 'object' && startDate.format) {
            startDate = startDate.format('YYYY-MM-DD HH:mm')
        }
        if (endDate && typeof endDate === 'object' && endDate.format) {
            endDate = endDate.format('YYYY-MM-DD HH:mm')
        }
        
        // If date is "Invalid Date" or similar garbage, unset it
        if (startDate && (startDate === 'Invalid Date' || startDate.toString() === 'Invalid Date')) startDate = undefined
        if (endDate && (endDate === 'Invalid Date' || endDate.toString() === 'Invalid Date')) endDate = undefined

        await estimateTask({ 
            taskId: task.id, 
            roleId, 
            hours,
            startDate,
            endDate,
            collaboratorId
        })
        emit('refetch')
        collaboratorEditing.value = null
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al asignar colaborador', 'error')
    }
}

// Search logic removed (moved to modal)

const handleSaveDraft = async () => {
    if(!draftName.value) return
    
    try {
        const parsedWPDate = parseDateSafe(props.wp?.startDate)
        const wpStartDateFormatted = parsedWPDate && parsedWPDate.isValid() 
            ? parsedWPDate.format('YYYY-MM-DD HH:mm') 
            : dayjs().startOf('day').format('YYYY-MM-DD HH:mm')

        const { data } = await createTask({ 
            workPackageId: props.wp.id, 
            name: draftName.value, 
            startDate: wpStartDateFormatted
        })
        const newTask = data.createTask
        
        // Create estimations for filled roles
        const entries = Object.entries(draftEstimations.value)
        const estimationPromises = entries.map(async ([roleId, hoursStr]) => {
            const hours = parseFloat(hoursStr)
            if (hours > 0) {
                 // Auto-assign logic specific to this role
                 let collaboratorId = null
                 const matchingAllocations = props.projectAllocations.filter(a => 
                    a.roles?.some(r => r.id === roleId)
                 )
                 if (matchingAllocations.length === 1) {
                     collaboratorId = matchingAllocations[0].collaborator.id
                 }
                 
                 // Simple Date Logic for draft
                 const estStart = dayjs(wpStartDateFormatted)
                 const days = Math.ceil(hours / 8)
                 const estEnd = estStart.add(days, 'day')

                 return estimateTask({ 
                     taskId: newTask.id, 
                     roleId, 
                     hours,
                     startDate: estStart.format('YYYY-MM-DD HH:mm'),
                     endDate: estEnd.format('YYYY-MM-DD HH:mm'),
                     collaboratorId
                })
            }
            return Promise.resolve()
        })
        
        await Promise.all(estimationPromises)
        
        draftName.value = ''
        draftEstimations.value = {}
        emit('refetch')
        notificationStore.showToast('Tarea creada', 'success')
    } catch (e) {
        notificationStore.showToast(e.message, 'error')
    }
}




</script>
