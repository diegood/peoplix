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
                  <input type="date" 
                  :value="formatDate(wp.startDate)" 
                  @change="handleUpdateWPDate"
                  @click.stop
                  class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span class="text-xs text-gray-500 ml-2">| {{ wpEndDate || '-'}}</span>
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
                       <td class="py-2 pl-2 font-medium relative group align-top">
                           <div class="flex flex-col gap-1">
                               <div class="flex items-center gap-2">
                                   <div class="relative">
                                       <button @click="descriptionEditing = descriptionEditing === task.id ? null : task.id" 
                                               class="text-gray-400 hover:text-blue-600 transition-colors"
                                               :class="{'text-blue-600': task.description}">
                                           <FileText :size="14" />
                                       </button>

                                       <!-- Description Popover -->
                                       <div v-if="descriptionEditing === task.id" 
                                            class="absolute top-8 left-0 z-50 bg-white border shadow-lg rounded p-3 w-72">
                                           <textarea 
                                               :value="task.description" 
                                               @change="(e) => handleUpdateTaskDesc(task.id, e.target.value)"
                                               class="w-full text-xs border rounded p-2 h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2"
                                               placeholder="Añadir descripción..."
                                           ></textarea>
                                           <div class="flex justify-end gap-2">
                                               <button @click="descriptionEditing = null" class="text-xs text-gray-500 hover:text-gray-800">Cerrar</button>
                                           </div>
                                       </div>
                                   </div>

                                   <input :value="task.name" 
                                          class="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-gray-700"
                                          @change="(e) => handleUpdateTaskName(task.id, e.target.value)" />
                               </div>
                               <!-- Task Totals -->
                               <div class="pl-6 text-[10px] text-gray-400 flex items-center gap-2" v-if="getTaskSummary(task).totalHours > 0">
                                   <span class="font-bold text-gray-500">{{ getTaskSummary(task).totalHours }}h</span>
                                   <span>|</span>
                                   <span>{{ getTaskSummary(task).dateRange }}</span>
                               </div>
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
                 if (matchingAllocations.length > 0) {
                     // Round Robin: Use current task count to cycle through collaborators
                     // We use props.wp.tasks.length because the new task isn't in the list yet
                     // If multiple tasks are added, this index needs to be offset, but for manual entry it's fine.
                     const index = (props.wp.tasks?.length || 0) % matchingAllocations.length
                     collaboratorId = matchingAllocations[index].collaborator.id
                 }
                 
                 // Sequential Logic: Find the latest end date for this role to schedule after
                 let estStart = dayjs(wpStartDateFormatted)
                 
                 // Look for the last task that has an estimation for this role
                 let lastEndDateForRole = null
                 if(props.wp.tasks && props.wp.tasks.length > 0) {
                     // Check in reverse order to find the last one
                     for (let i = props.wp.tasks.length - 1; i >= 0; i--) {
                         const t = props.wp.tasks[i]
                         const prevEst = t.estimations?.find(e => e.role.id === roleId)
                         
                         // Check if this previous task belongs to the SAME collaborator (or both unassigned)
                         const prevCollabId = prevEst?.collaborator?.id || null
                         if (prevEst && prevEst.endDate && prevCollabId === collaboratorId) {
                             const prevEnd = parseDateSafe(prevEst.endDate)
                             if (prevEnd && prevEnd.isValid()) {
                                 lastEndDateForRole = prevEnd
                                 break
                             }
                         }
                     }
                 }

                 if (lastEndDateForRole) {
                     estStart = lastEndDateForRole
                     // If it ended on Friday, next start should be Monday? 
                     // Or if it ended at 17:00, next starts next day?
                     // Currently end dates are usually end of day? Or calculated.
                     // Let's assuming end date is inclusive of the work. So we start AFTER it.
                     // But if prev task ends at standard time, we might want next day.
                     // For simplicity in Gantt, let's say we start immediately after (consecutive).
                     // But strictly speaking, if prev ends 2024-01-01, new starts 2024-01-02?
                     // My Gantt logic usually sets end date same as start if < 8h?
                     // Let's try adding 0 days (starts same time? No)
                     // Safest is to start the NEXT business day if the previous task took the whole day.
                     // But we don't know if it took whole day easily.
                     // Let's assume sequential means next business second/day.
                     // Given formatting YYYY-MM-DD HH:mm, if we copy the date we overlap?
                     // Let's use `addBusinessDays(lastEndDateForRole, 0)` which just adjusts for weekends.
                     // Actually, if we want them to be sequential bars, start should = previous end.
                     // Overlap is fine if it's "finish-to-start".
                     estStart = lastEndDateForRole
                 }

                 // Ensure start is business day check
                 while (estStart.day() === 0 || estStart.day() === 6) {
                     estStart = estStart.add(1, 'day')
                 }

                 const days = hours / 8 // Using corrected 8h factor
                 const estEnd = addBusinessDays(estStart, days)

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



// Helper to get task summary (hours + dates)
const getTaskSummary = (task) => {
    if (!task.estimations || task.estimations.length === 0) return { totalHours: 0, dateRange: '-' }
    
    let total = 0
    let minDate = null
    let maxDate = null

    task.estimations.forEach(est => {
        total += est.hours
        if (est.startDate) {
            const d = parseDateSafe(est.startDate)
            if (d && d.isValid()) {
                if (!minDate || d.isBefore(minDate)) minDate = d
            }
        }
        if (est.endDate) {
            const d = parseDateSafe(est.endDate)
            if (d && d.isValid()) {
                if (!maxDate || d.isAfter(maxDate)) maxDate = d
            }
        }
    })

    let dateRange = '-'
    if (minDate) {
        dateRange = minDate.format('DD/MM')
        if (maxDate && !maxDate.isSame(minDate, 'day')) {
            dateRange += ` - ${maxDate.format('DD/MM')}`
        }
    }
    
    return { totalHours: total, dateRange }
}
// Work Package End Date Calculation
const wpEndDate = computed(() => {
    if (!props.wp.tasks || props.wp.tasks.length === 0) return '-'
    let maxDate = null
    
    props.wp.tasks.forEach(task => {
        task.estimations?.forEach(est => {
            if (est.endDate) {
                const d = parseDateSafe(est.endDate)
                if (d && d.isValid()) {
                    if (!maxDate || d.isAfter(maxDate)) maxDate = d
                }
            }
        })
    })
    return maxDate ? maxDate.format('DD/MM/YYYY') : '-'
})

</script>
