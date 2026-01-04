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
                  @change="(e) => handleUpdateWPDate(wp.id, wp.name, e.target.value)"
                  @click.stop
                  class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span class="text-xs text-gray-500 ml-2">| {{ wpEndDateComputed || '-'}}</span>
              </div>
          </div>
          <div class="flex items-center gap-4">
               <button 
                  @click.stop="handleStartAllWork" 
                  class="text-gray-400 hover:text-green-500 transition-colors"
                  title="Iniciar todas las tareas"
               >
                   <Play size="18" />
               </button>

               <div class="text-sm font-medium text-gray-600">
                   {{ wp.tasks?.reduce((acc, t) => acc + (t.estimations?.reduce((a,e)=>a+e.hours,0) || 0), 0) }}h
               </div>
               
               <div @click.stop class="relative z-10">
                   <select 
                       :value="wp.status || 'BACKLOG'" 
                       @change="(e) => handleUpdateStatus(wp.id, e.target.value)"
                       class="text-xs border rounded-lg py-1.5 pl-3 pr-8 font-medium outline-none cursor-pointer appearance-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500 hover:border-gray-300 w-32"
                       :style="activeStatusStyle"
                   >
                       <option v-for="status in sortedStatuses" :key="status.id" :value="status.name">
                           {{ status.name }}
                       </option>
                       <option v-if="!sortedStatuses.some(s => s.name === wp.status) && wp.status" :value="wp.status">{{ wp.status }}</option>
                   </select> 
                   <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                   </div>
               </div>

              <button @click.stop="handleDeleteWP(wp.id)" class="text-red-400 hover:text-red-600">
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
                  <EstimationTaskRow 
                     v-for="task in wp.tasks" 
                     :key="task.id"
                     :task="task"
                     :roleColumns="roleColumns"
                     :tasksOptions="wp.tasks.filter(t => t.id !== task.id)"
                     @update-name="handleUpdateTaskName"
                     @update-desc="handleUpdateTaskDesc"
                     @update-est="handleUpdateEst"
                     @delete-task="handleDeleteTask"
                     @remove-dependency="handleRemoveDependency"
                     @open-assignment="openAssignmentModal"
                     @start-work="handleStartWork"
                     @open-detail="openTaskDetail"
                  />
                  
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
                       <td></td>
                  </tr>
                  
                  <tr class="bg-blue-50/50 border-t border-blue-100">
                      <td class="py-3 pl-2 font-bold text-gray-700 text-xs uppercase">Totales por Rol</td>
                      <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center font-bold text-gray-700 text-xs">
                          {{ roleSummaries[role.id] || '-' }}
                      </td>
                      <td colspan="3"></td>
                  </tr>
              </tbody>
          </table>
      </div>
      
      <div v-show="isExpanded" class="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
        <div class="flex items-center justify-between mb-2 mt-4">
             <h5 class="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Clock size="12"/> Eventos Recurrentes
             </h5>
             <button @click="openRecurrentModal" class="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                 <Plus size="12" /> Agregar Evento
             </button>
        </div>
        
        <div v-if="wp.recurrentEvents && wp.recurrentEvents.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
             <div v-for="event in wp.recurrentEvents" :key="event.id" class="bg-white border border-gray-200 rounded p-2 flex justify-between items-start">
                 <div>
                     <div class="text-sm font-medium text-gray-700">{{ event.name }}</div>
                     <div class="text-xs text-gray-500 flex items-center gap-1">
                        <span class="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold">{{ event.type }}</span>
                        <span>{{ event.hours }}h</span>
                     </div>
                 </div>
                 <button @click="handleDeleteRecurrentEvent(event.id)" class="text-gray-400 hover:text-red-500">
                     <Trash size="14" />
                 </button>
             </div>
        </div>
        <div v-else class="text-xs text-gray-400 italic">No hay eventos recurrentes definidos</div>
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
      
      <RecurrentEventModal 
        v-if="recurrentModalOpen"
        :isOpen="recurrentModalOpen"
        :workPackageId="wp.id"
        @close="recurrentModalOpen = false"
        @save="handleSaveRecurrentEvent"
      />
      
      <TaskDetailModal
        v-if="taskDetailOpen"
        :isOpen="taskDetailOpen"
        :task="selectedTaskForDetail"
        :availableRoles="roleColumns"
        @close="taskDetailOpen = false"
        @refetch="$emit('refetch')"
      />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_WORK_PACKAGE_STATUSES } from '@/modules/Configuration/graphql/status.queries'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { Trash, ChevronDown, ChevronRight, Play, Clock, Plus } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'
import { useNotificationStore } from '@/stores/notificationStore'
import { parseDateSafe, formatDate, addWorkingDays } from '@/helper/Date'
import { getEst, calculateWPEndDate, calculateSequentialStartDate, getBlockedDates, getComputedSchedule, calculateEstimation } from '@/modules/Allocations/helpers/estimationHelpers'
import { DATE_TIME_FORMAT_API } from '@/config/constants'
import { useEstimationMutations } from './useEstimationMutations'
import { useRoute } from 'vue-router'

const route = useRoute()

import CollaboratorAssignmentModal from './CollaboratorAssignmentModal.vue'
import EstimationTaskRow from './EstimationTaskRow.vue'
import RecurrentEventModal from './components/RecurrentEventModal.vue'
import TaskDetailModal from './components/TaskDetailModal.vue'


const props = defineProps({
  wp: { type: Object, required: true },
  roleColumns: { type: Array, required: true },
  initiallyExpanded: { type: Boolean, default: false },
  projectCollaborators: { type: Array, default: () => [] },
  projectAllocations: { type: Array, default: () => [] } 
})

const recalculateAllEstimations = async (updatedRecurrentEvents) => {
    if (!props.wp.tasks || props.wp.tasks.length === 0) return

    let runningTasks = JSON.parse(JSON.stringify(props.wp.tasks))
    const mutations = []

    const wpStartDate = parseDateSafe(props.wp?.startDate) || dayjs().startOf('day')
    const wpStartDateFormatted = wpStartDate.format(DATE_TIME_FORMAT_API)

    for (let i = 0; i < runningTasks.length; i++) {
        const task = runningTasks[i]
        const previousTasks = i > 0 ? runningTasks.slice(0, i) : []

        if (task.estimations && task.estimations.length > 0) {
            for (const est of task.estimations) {
                const roleId = est.role.id
                const hours = est.hours
                const collaboratorId = est.collaborator?.id

                if (hours > 0) {
                     const allocation = props.projectAllocations.find(a => a.collaborator.id === collaboratorId)
                     const blockedDates = getBlockedDates(allocation?.collaborator)
                     const schedule = getComputedSchedule(allocation?.collaborator)

                     const estStart = calculateSequentialStartDate(
                         roleId, 
                         previousTasks, 
                         wpStartDateFormatted,
                         collaboratorId,
                         blockedDates,
                         schedule,
                         updatedRecurrentEvents
                     )

                     const estEnd = addWorkingDays(estStart, hours, blockedDates, schedule, updatedRecurrentEvents)

                     const newStartStr = estStart.format(DATE_TIME_FORMAT_API)
                     const newEndStr = estEnd.format(DATE_TIME_FORMAT_API)

                     est.startDate = newStartStr
                     est.endDate = newEndStr

                     mutations.push(estimateTask({
                         taskId: task.id,
                         roleId: roleId,
                         hours: hours,
                         startDate: newStartStr,
                         endDate: newEndStr,
                         collaboratorId: collaboratorId
                     }))
                }
            }
        }
    }

    try {
        await Promise.all(mutations)
        emit('refetch')
        notificationStore.showToast('Planificación recalculada', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al recalcular planificación', 'error')
    }
}

const handleSaveRecurrentEvent = async (eventData) => {
    try {
        const { data } = await createRecurrentEvent(eventData)
        recurrentModalOpen.value = false
        
        const newEvent = data.createWorkPackageRecurrentEvent
        const updatedEvents = [...(props.wp.recurrentEvents || []), newEvent]
        
        await recalculateAllEstimations(updatedEvents)
        notificationStore.showToast('Evento recurrente creado', 'success')
    } catch(e) {
        console.error(e)
        notificationStore.showToast('Error al crear evento', 'error')
    }
}

const handleDeleteRecurrentEvent = async (id) => {
    if(await notificationStore.showDialog('¿Eliminar evento recurrente?', 'Eliminar')) {
        try {
            await deleteRecurrentEvent({ id })
            
            const updatedEvents = (props.wp.recurrentEvents || []).filter(e => e.id !== id)
            await recalculateAllEstimations(updatedEvents)
            
            notificationStore.showToast('Evento eliminado', 'success')
        } catch {
            notificationStore.showToast('Error al eliminar evento', 'error')
        }
    }
}

const emit = defineEmits(['refetch'])
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

import { useKanbanStore } from '@/modules/Kanban/store/kanban.store'
const kanbanStore = useKanbanStore()

const handleStartWork = async (task) => {
    if (!task.estimations || task.estimations.length === 0) {
        notificationStore.showToast('No hay estimaciones para iniciar', 'warning')
        return
    }

    try {
        const projectId = props.wp.workPackage?.projectId || props.wp.projectId || route.params.id
        await kanbanStore.createCardStructure(task.id, projectId)
        notificationStore.showToast('Tarea iniciada en Kanban', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al iniciar tarea', 'error')
    }
}

const handleStartAllWork = async () => {
    if (!props.wp.tasks || props.wp.tasks.length === 0) return

    const tasksToStart = props.wp.tasks.filter(t => t.estimations && t.estimations.length > 0)
    
    if (tasksToStart.length === 0) {
        notificationStore.showToast('No hay tareas con estimación para iniciar', 'warning')
        return
    }

    if (!await notificationStore.showDialog(`¿Iniciar ${tasksToStart.length} tareas en Kanban?`, 'Iniciar Trabajo')) return

    let startedCount = 0
    let errors = 0

    const projectId = props.wp.workPackage?.projectId || props.wp.projectId || route.params.id

    for (const task of tasksToStart) {
        try {
            await kanbanStore.createCardStructure(task.id, projectId)
            startedCount++
        } catch (e) {
            console.error(e)
            errors++
        }
    }

    if (startedCount > 0) {
        notificationStore.showToast(`${startedCount} tareas iniciadas correctamente`, 'success')
    }
    if (errors > 0) {
         notificationStore.showToast(`${errors} fallaron al iniciar`, 'error')
    }
}

const { 
  handleUpdateTaskName, 
  handleUpdateTaskDesc, 
  handleDeleteWP, 
  handleUpdateWPDate, 
  handleUpdateStatus, 
  handleDeleteTask, 
  handleRemoveDependency,
  createTask,
  estimateTask,
  createRecurrentEvent,
  deleteRecurrentEvent
} = useEstimationMutations(() => emit('refetch'))

const { result: statusResult } = useQuery(GET_WORK_PACKAGE_STATUSES, () => ({
    organizationId: authStore.user?.organizationId
}), { enabled: computed(() => !!authStore.user?.organizationId) })

const sortedStatuses = computed(() => {
    return statusResult.value?.workPackageStatuses 
        ? [...statusResult.value.workPackageStatuses].sort((a,b) => a.order - b.order)
        : []
})

const activeStatusStyle = computed(() => {
    const status = sortedStatuses.value.find(s => s.name === props.wp.status)
    if (status) {
        return {
             borderColor: status.color,
             color: status.color,
             backgroundColor: '#ffffff'
        }
    }
    return {}
})
const isExpanded = ref(props.initiallyExpanded)
const toggleExpand = () => isExpanded.value = !isExpanded.value

const draftName = ref('')
const draftEstimations = ref({})

const assignmentModalOpen = ref(false)
const assignmentContext = ref({
    task: null,
    roleId: null,
    roleName: '',
    currentCollaboratorId: null
})

const recurrentModalOpen = ref(false)
const openRecurrentModal = () => recurrentModalOpen.value = true

const taskDetailOpen = ref(false)
const selectedTaskForDetail = ref(null)

const openTaskDetail = (task) => {
    selectedTaskForDetail.value = task
    taskDetailOpen.value = true
}

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

const handleUpdateEst = async (taskId, roleId, hoursStr) => {
    console.log('handleUpdateEst called', { taskId, roleId, hoursStr })
    try {
        const hours = parseFloat(hoursStr) || 0
        
        let startDateStr = undefined
        let endDateStr = undefined
        
        if (hours > 0) {
             const taskIndex = props.wp.tasks.findIndex(t => t.id === taskId)
             const task = props.wp.tasks[taskIndex]
             const wpStartDate = parseDateSafe(props.wp?.startDate) || dayjs().startOf('day')
             const wpStartDateFormatted = wpStartDate.format(DATE_TIME_FORMAT_API)

             const currentEst = getEst(task, roleId)
             
             let forceStart = undefined
             if (task.startDate && parseDateSafe(task.startDate)?.isValid()) {
                forceStart = parseDateSafe(task.startDate)
             }

             const result = calculateEstimation({
                 roleId,
                 hours,
                 taskIndex,
                 allTasks: props.wp.tasks,
                 wpStartDateFormatted,
                 projectAllocations: props.projectAllocations,
                 recurrentEvents: props.wp.recurrentEvents,
                 existingEstimation: currentEst,
                 forceStartDate: forceStart
             })
             
             startDateStr = result.startDate.format(DATE_TIME_FORMAT_API)
             endDateStr = result.endDate.format(DATE_TIME_FORMAT_API)
             
             console.log('Centralized Recalc Debug', { 
                 estStart: result.startDate.format(), 
                 estEnd: result.endDate.format()
             })
        }

        await estimateTask({ 
            taskId, 
            roleId, 
            hours,
            startDate: startDateStr,
            endDate: endDateStr
        })
        emit('refetch')
    } catch {
        notificationStore.showToast('Error al actualizar estimación', 'error')
    }
}

const handleUpdateEstCollaborator = async (task, roleId, collaboratorId) => {
    try {
        const est = getEst(task, roleId)
        const hours = est?.hours || 0
        
        let startDate = est?.startDate
        let endDate = est?.endDate

        if (startDate && typeof startDate === 'object' && startDate.format) {
            startDate = startDate.format(DATE_TIME_FORMAT_API)
        }
        if (endDate && typeof endDate === 'object' && endDate.format) {
            endDate = endDate.format(DATE_TIME_FORMAT_API)
        }
        
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
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al asignar colaborador', 'error')
    }
}

const handleSaveDraft = async () => {
    if(!draftName.value) return
    
    try {
        const parsedWPDate = parseDateSafe(props.wp?.startDate)
        const wpStartDateFormatted = parsedWPDate && parsedWPDate.isValid() 
            ? parsedWPDate.format(DATE_TIME_FORMAT_API) 
            : dayjs().startOf('day').format(DATE_TIME_FORMAT_API)

        const { data } = await createTask({ 
            workPackageId: props.wp.id, 
            name: draftName.value, 
            startDate: wpStartDateFormatted
        })
        const newTask = data.createTask
        
        const entries = Object.entries(draftEstimations.value)
        const estimationPromises = entries.map(async ([roleId, hoursStr]) => {
            const hours = parseFloat(hoursStr)
            if (hours > 0) {
                 const result = calculateEstimation({
                     roleId,
                     hours,
                     taskIndex: props.wp.tasks?.length || 0,
                     allTasks: props.wp.tasks || [],
                     wpStartDateFormatted,
                     projectAllocations: props.projectAllocations,
                     recurrentEvents: props.wp.recurrentEvents
                 })

                 const estStart = result.startDate
                 const estEnd = result.endDate
                 const collaboratorId = result.collaboratorId

                 return estimateTask({ 
                     taskId: newTask.id, 
                     roleId, 
                     hours,
                     startDate: estStart.format(DATE_TIME_FORMAT_API),
                     endDate: estEnd.format(DATE_TIME_FORMAT_API),
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

const wpEndDateComputed = computed(() => dateToString(calculateWPEndDate(props.wp.tasks)))
const dateToString = (d) => d ? d.format('DD/MM/YYYY') : '-'

const roleSummaries = computed(() => {
    const sums = {}
    props.wp.tasks?.forEach(task => {
        task.estimations?.forEach(est => {
            if (!sums[est.role.id]) sums[est.role.id] = 0
            sums[est.role.id] += est.hours
        })
    })
    return sums
})
</script>
