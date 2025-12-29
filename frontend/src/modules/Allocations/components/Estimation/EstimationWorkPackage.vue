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
                     @add-dependency="handleAddDependency"
                     @remove-dependency="handleRemoveDependency"
                     @open-assignment="openAssignmentModal"
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
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_WORK_PACKAGE_STATUSES } from '@/modules/Configuration/graphql/status.queries'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { Trash, ChevronDown, ChevronRight } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'
import { useNotificationStore } from '@/stores/notificationStore'
import { parseDateSafe, formatDate, addBusinessDays } from '@/helper/Date'
import { getEst, calculateWPEndDate, findRoundRobinCollaborator, calculateSequentialStartDate, getBlockedDates, getComputedSchedule } from '@/modules/Allocations/helpers/estimationHelpers'
import { GANTT_VISUAL_FACTOR, DATE_TIME_FORMAT_API } from '@/config/constants'
import { useEstimationMutations } from './useEstimationMutations'

import CollaboratorAssignmentModal from './CollaboratorAssignmentModal.vue'
import EstimationTaskRow from './EstimationTaskRow.vue'

const props = defineProps({
  wp: { type: Object, required: true },
  roleColumns: { type: Array, required: true },
  initiallyExpanded: { type: Boolean, default: false },
  projectCollaborators: { type: Array, default: () => [] },
  projectAllocations: { type: Array, default: () => [] } 
})

const emit = defineEmits(['refetch'])
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const { 
  handleUpdateTaskName, 
  handleUpdateTaskDesc, 
  handleDeleteWP, 
  handleUpdateWPDate, 
  handleUpdateStatus, 
  handleDeleteTask, 
  handleAddDependency, 
  handleRemoveDependency,
  createTask,
  estimateTask
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
    try {
        const hours = parseFloat(hoursStr) || 0
        
        let startDateStr = undefined
        let endDateStr = undefined
        
        if (hours > 0) {
             const taskIndex = props.wp.tasks.findIndex(t => t.id === taskId)
             const previousTasks = taskIndex > 0 ? props.wp.tasks.slice(0, taskIndex) : []
             const wpStartDate = parseDateSafe(props.wp?.startDate) || dayjs().startOf('day')

             const task = props.wp.tasks[taskIndex]
             const currentEst = getEst(task, roleId)
             const collaboratorId = currentEst?.collaborator?.id
             const allocation = props.projectAllocations.find(a => a.collaborator.id === collaboratorId)
             const blockedDates = getBlockedDates(allocation?.collaborator)
             const schedule = getComputedSchedule(allocation?.collaborator)

             const estStart = calculateSequentialStartDate(roleId, previousTasks, wpStartDate, collaboratorId, blockedDates, schedule) 

             const days = hours / GANTT_VISUAL_FACTOR
             const estEnd = addBusinessDays(estStart, days, blockedDates, schedule)
             
             startDateStr = estStart.format(DATE_TIME_FORMAT_API)
             endDateStr = estEnd.format(DATE_TIME_FORMAT_API)
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
                 const collaboratorId = findRoundRobinCollaborator(
                     roleId, 
                     props.projectAllocations, 
                     props.wp.tasks?.length
                 )
                 const allocation = props.projectAllocations.find(a => a.collaborator.id === collaboratorId)
                 const blockedDates = getBlockedDates(allocation?.collaborator)
                 const schedule = getComputedSchedule(allocation?.collaborator)

                 const estStart = calculateSequentialStartDate(
                     roleId, 
                     props.wp.tasks, 
                     wpStartDateFormatted,
                     collaboratorId,
                     blockedDates,
                     schedule
                 )

                 const days = hours / GANTT_VISUAL_FACTOR
                 const estEnd = addBusinessDays(estStart, days, blockedDates, schedule)

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

</script>
