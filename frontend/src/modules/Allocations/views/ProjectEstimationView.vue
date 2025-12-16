<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PROJECT_WORK_PACKAGES, GET_PROJECTS } from '@/graphql/queries'
import { CREATE_WORK_PACKAGE, CREATE_TASK, UPDATE_TASK, UPDATE_WORK_PACKAGE, ESTIMATE_TASK, DELETE_WORK_PACKAGE, ADD_TASK_DEPENDENCY, REMOVE_TASK_DEPENDENCY } from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'
import { Trash, ChevronDown, ChevronRight, Link, X } from 'lucide-vue-next'
import dayjs from '@/config/dayjs'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const route = useRoute()
const projectId = route.params.id
const notificationStore = useNotificationStore()

const { result: projectResult } = useQuery(GET_PROJECTS)
const { result: wpResult, refetch: refetchWP } = useQuery(GET_PROJECT_WORK_PACKAGES, { projectId })

const project = computed(() => {
    return projectResult.value?.projects?.find(p => p.id === projectId)
})

const workPackages = computed(() => wpResult.value?.projectWorkPackages || [])

const { mutate: createWorkPackage } = useMutation(CREATE_WORK_PACKAGE)
const { mutate: createTask } = useMutation(CREATE_TASK)
const { mutate: estimateTask } = useMutation(ESTIMATE_TASK)
const { mutate: deleteWorkPackage } = useMutation(DELETE_WORK_PACKAGE)

const newWPName = ref('')
const expandedWP = ref({}) 

const handleCreateWP = async () => {
    if (!newWPName.value) return
    try {
        await createWorkPackage({ projectId, name: newWPName.value })
        newWPName.value = ''
        refetchWP()
        notificationStore.showToast('Funcionalidad creada', 'success')
    } catch (e) {
        notificationStore.showToast(e.message, 'error')
    }
}

const handleDeleteWP = async (id) => {
    if (confirm('¿Eliminar funcionalidad y todas sus tareas?')) {
        await deleteWorkPackage({ id })
        refetchWP()
    }
}

const { mutate: updateTask } = useMutation(UPDATE_TASK)

const draftTasks = ref({}) // { wpId: { name: '', estimations: { roleId: hours } } }

const getDraft = (wpId) => {
    if (!draftTasks.value[wpId]) {
        draftTasks.value[wpId] = { name: '', estimations: {} }
    }
    return draftTasks.value[wpId]
}

const saveDraft = async (wpId) => {
    const draft = getDraft(wpId)
    if (!draft.name) return
    
    try {
        const wp = workPackages.value.find(w => w.id === wpId)
        
        const parsedWPDate = parseDateSafe(wp?.startDate)
        const defaultDate = parsedWPDate && parsedWPDate.isValid() 
            ? parsedWPDate.format('YYYY-MM-DD') 
            : dayjs().format('YYYY-MM-DD')
        
        const { data } = await createTask({ 
            workPackageId: wpId, 
            name: draft.name, 
            startDate: defaultDate 
        })
        const newTask = data.createTask
        
        // 2. Estimate Roles (Parallel)
        const estimationPromises = Object.entries(draft.estimations).map(([roleId, hours]) => {
            if (hours > 0) {
               return estimateTask({ taskId: newTask.id, roleId, hours: parseFloat(hours) })
            }
            return Promise.resolve()
        })
        
        await Promise.all(estimationPromises)
        
        draftTasks.value[wpId] = { name: '', estimations: {} }
        await refetchWP()
        notificationStore.showToast('Tarea creada', 'success')
    } catch (e) {
        notificationStore.showToast(e.message, 'error')
    }
}
const handleUpdateTaskName = async (id, name) => {
    try {
        await updateTask({ id, name })
    } catch (e) {
        console.error(e)
    }
}

const updateEst = async (taskId, roleId, hours) => {
    try {
        await estimateTask({ taskId, roleId, hours: parseFloat(hours) || 0 })
    } catch (e) {
        console.error(e)
    }
}

const { mutate: addTaskDependency } = useMutation(ADD_TASK_DEPENDENCY)
const { mutate: removeTaskDependency } = useMutation(REMOVE_TASK_DEPENDENCY)

const addingDepFor = ref(null) // taskId

const handleAddDependency = async (taskId, predecessorId) => {
    if (!predecessorId) return
    try {
        await addTaskDependency({ taskId, predecessorId })
        addingDepFor.value = null
        refetchWP() // Refresh to get updated dates
    } catch (e) {
         notificationStore.showToast(e.message, 'error')
    }
}

const handleRemoveDependency = async (taskId, predecessorId) => {
    try {
        await removeTaskDependency({ taskId, predecessorId })
        refetchWP()
    } catch (e) {
         console.error(e)
    }
}

const roleColumns = computed(() => {
    if (!project.value) return []
    return project.value.requiredRoles.map(rr => rr.role)
})

const summary = computed(() => {
    let totalHours = 0
    workPackages.value.forEach(wp => {
        wp.tasks?.forEach(t => {
            t.estimations?.forEach(e => {
                totalHours += e.hours
            })
        })
    })
    return { totalHours }
})

const { mutate: updateWorkPackage } = useMutation(UPDATE_WORK_PACKAGE)

const handleUpdateWPStartDate = async (wp, e) => {
    const date = e.target.value
    if (!date) return
    try {
        await updateWorkPackage({ id: wp.id, name: wp.name, startDate: date })
        refetchWP() // Refetch to update UI and maybe trigger Gantt update
    } catch(err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const parseDateSafe = (val) => {
    if (!val) return null
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return dayjs.utc(parseInt(val))
    }
    return dayjs(val)
}

const formatDate = (dateVal) => {
    const d = parseDateSafe(dateVal)
    return d && d.isValid() ? d.format('YYYY-MM-DD') : ''
}

const chartStart = computed(() => {
    // Find earliest start date among Work Packages
    let earliest = null
    workPackages.value.forEach(wp => {
        const d = parseDateSafe(wp.startDate)
        if (d && d.isValid()) {
            if (!earliest || d.isBefore(earliest)) {
                earliest = d
            }
        }
    })
    
    if (earliest) {
        return earliest.format('YYYY-MM-DD HH:mm')
    }
    return dayjs().startOf('month').format('YYYY-MM-DD HH:mm')
})

const chartEnd = computed(() => {
    return dayjs(chartStart.value).add(3, 'month').format('YYYY-MM-DD HH:mm')
})

const addBusinessDays = (startDate, hours) => {
    let cursor = dayjs(startDate)
    let visualHoursRemaining = hours * 3
    
    if (visualHoursRemaining <= 0) visualHoursRemaining = 3
    
    let loops = 0
    const MAX_LOOPS = 1000 

    while (visualHoursRemaining > 0.1 && loops < MAX_LOOPS) {
        loops++
        const dayOfWeek = cursor.day()
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
             cursor = cursor.add(1, 'day').startOf('day')
             continue
        }

        const nextDayStart = cursor.add(1, 'day').startOf('day')
        const hoursUntilOvernight = nextDayStart.diff(cursor, 'minute') / 60.0
        
        if (hoursUntilOvernight < 0.1) {
             cursor = nextDayStart
             continue
        }

        const chunk = Math.min(visualHoursRemaining, hoursUntilOvernight)
        
        cursor = cursor.add(chunk, 'hour')
        visualHoursRemaining -= chunk
    }
    return cursor
}

const handleDragEndBar = async (e) => {
    const { bar, movedBars } = e
    const [taskId, roleId] = bar.ganttBarConfig.id.split('|')
    const newStartDate = dayjs(bar.myBeginDate).format('YYYY-MM-DD')
    
    try {
        await updateTask({ id: taskId, startDate: newStartDate })
        await refetchWP()
        notificationStore.showToast('Fecha actualizada', 'success')
    } catch (err) {
        notificationStore.showToast('Error al mover tarea', 'error')
        refetchWP()
    }
}

const ganttRows = computed(() => {
    if (!project.value || !project.value.requiredRoles) return []

    const rows = []
    
    const roleRowMap = {}
    
    project.value.requiredRoles.forEach(req => {
        roleRowMap[req.role.id] = []
        for (let i = 0; i < req.resourceCount; i++) {
             const row = {
                 label: `${req.role.name} ${i + 1}`,
                 bars: []
             }
             rows.push(row)
             roleRowMap[req.role.id].push(row)
        }
    })

    const allTasks = workPackages.value.flatMap(wp => 
        (wp.tasks || []).map(t => ({...t, wpSubtitle: wp.name, wpStart: wp.startDate}))
    )
    
    allTasks.forEach(task => {
        if (!task.estimations) return

        task.estimations.forEach(est => {
            if (est.hours > 0) {
                 const roleId = est.role.id
                 const eligibleRows = roleRowMap[roleId]
                 
                 if (eligibleRows && eligibleRows.length > 0) {
                     
                     let taskStart = parseDateSafe(task.startDate)
                     
                     if (!taskStart || !taskStart.isValid()) {
                        const wpS = parseDateSafe(task.wpStart)
                        taskStart = (wpS && wpS.isValid()) ? wpS : dayjs()
                     }

                     const taskEnd = addBusinessDays(taskStart, est.hours)

                     let targetRow = eligibleRows[0]
                     
                     const freeRow = eligibleRows.find(row => {
                         return !row.bars.some(bar => {
                             const bStart = dayjs(bar.myBeginDate)
                             const bEnd = dayjs(bar.myEndDate)
                             return (taskStart.isBefore(bEnd) && taskEnd.isAfter(bStart))
                         })
                     })
                     
                     if (freeRow) targetRow = freeRow

                     targetRow.bars.push({
                         myBeginDate: taskStart.format('YYYY-MM-DD HH:mm'),
                         myEndDate: taskEnd.format('YYYY-MM-DD HH:mm'),
                         ganttBarConfig: {
                             id: task.id + '|' + roleId,
                             label: `${task.name} (${est.hours}h)`,
                             style: { background: '#3b82f6', borderRadius: '4px', color: 'white', fontSize:'11px' },
                             hasHandles: true
                         }
                     })
                 }
            }
        })
    })

    return rows
})

</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8" v-if="project">
      <div class="flex justify-between items-center">
          <div>
              <h1 class="text-3xl font-bold text-gray-900">Estimación de {{ project.name }}</h1>
                  <p class="text-gray-500">Gestión de funcionalidades y tiempos.</p>
          </div>
          <div>
              <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-right">
                  <div class="text-xs text-indigo-500 font-bold uppercase">Total Estimado</div>
                  <div class="text-2xl font-bold text-indigo-700">{{ summary.totalHours }}h</div>
              </div>
          </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-700 mb-4">Crear Estimación (Funcionalidad)</h3>
          <div class="flex gap-4">
              <input v-model="newWPName" placeholder="Nombre de la funcionalidad..." 
                     class="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" @keyup.enter="handleCreateWP" />
              <button @click="handleCreateWP" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  Agregar
              </button>
          </div>
      </div>

      <div class="space-y-4">
          <div v-for="wp in workPackages" :key="wp.id" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-4 bg-gray-50 flex justify-between items-center cursor-pointer" @click="expandedWP[wp.id] = !expandedWP[wp.id]">
                  <div class="flex items-center gap-3">
                      <button class="text-gray-400">
                          <ChevronDown v-if="expandedWP[wp.id]" size="20"/>
                          <ChevronRight v-else size="20" />
                      </button>
                      <div>
                          <h4 class="font-bold text-gray-800">{{ wp.name }}</h4>
                          <span class="text-xs text-gray-500" v-if="wp.highLevelEstimation">Estimación Alta: {{ wp.highLevelEstimation }}h</span>
                          <span class="text-gray-300 mx-2">|</span>
                          <input type="date" 
                                 :value="formatDate(wp.startDate)" 
                                 @change="(e) => handleUpdateWPStartDate(wp, e)"
                                 @click.stop
                                 class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                      </div>
                  </div>
                  <div class="flex items-center gap-4">
                       <div class="text-sm font-medium text-gray-600">
                           {{ wp.tasks?.reduce((acc, t) => acc + (t.estimations?.reduce((a,e)=>a+e.hours,0) || 0), 0) }}h
                       </div>
                      <button @click.stop="handleDeleteWP(wp.id)" class="text-red-400 hover:text-red-600">
                          <Trash size="18" />
                      </button>
                  </div>
              </div>

              <div v-show="expandedWP[wp.id]" class="p-4 border-t border-gray-100">
                  <table class="w-full text-sm">
                      <thead>
                          <tr class="text-left text-gray-500 border-b">
                              <th class="pb-2 pl-2">Tarea</th>
                              <th v-for="role in roleColumns" :key="role.id" class="pb-2 w-24 text-center">{{ role.name }} (h)</th>
                              <th class="pb-2 w-48 text-center">Dependencias</th>
                              <th class="pb-2 w-10"></th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="task in wp.tasks" :key="task.id" class="border-b border-gray-50 hover:bg-gray-50">
                              <td class="py-2 pl-2 font-medium">
                                  <input :value="task.name" 
                                         class="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-gray-700"
                                         @change="(e) => handleUpdateTaskName(task.id, e.target.value)" />
                              </td>
                              <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center">
                                  <input 
                                      type="number" 
                                      min="0"
                                      class="w-16 border rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                                      :value="task.estimations.find(e => e.role.id === role.id)?.hours || 0"
                                      @change="(e) => updateEst(task.id, role.id, e.target.value)"
                                  />
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
                                      
                                      <!-- Select Predecessor -->
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
                              <td class="py-2 text-center text-gray-400">
                                   <!-- Actions -->
                              </td>
                          </tr>
                          <tr class="bg-gray-50/50">
                              <td class="py-3 pl-2">
                                  <input placeholder="+ Nueva tarea..." 
                                         class="w-full bg-transparent border-none outline-none text-gray-600 placeholder-gray-400 focus:ring-0" 
                                         v-model="getDraft(wp.id).name"
                                         @keydown.enter="saveDraft(wp.id)" 
                                  />
                              </td>
                              <td v-for="role in roleColumns" :key="role.id" class="py-2 text-center">
                                   <input 
                                      type="number" 
                                      min="0"
                                      placeholder="-"
                                      class="w-16 border border-gray-200 rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none bg-white"
                                      v-model="getDraft(wp.id).estimations[role.id]"
                                      @keydown.enter="saveDraft(wp.id)"
                                  />
                              </td>
                              <td class="py-2 text-center">
                                  <button v-if="getDraft(wp.id).name" @click="saveDraft(wp.id)" class="text-blue-600 text-xs font-bold hover:underline">
                                      Guardar
                                  </button>
                              </td>
                              <td></td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      <div class="mt-8 bg-white p-4 rounded-xl shadow-sm" v-if="ganttRows.length > 0">
          <h3 class="font-bold text-gray-700 mb-4">Gráfico Gantt del Proyecto</h3>
          <div class="h-[400px] overflow-hidden">
               <GGanttChart
                :chart-start="chartStart"
                :chart-end="chartEnd"
                :precision="'day'"
                bar-start="myBeginDate"
                bar-end="myEndDate"
                :date-format="'YYYY-MM-DD HH:mm'"
                @dragend-bar="handleDragEndBar"
               >
                 <GGanttRow v-for="row in ganttRows" :key="row.label" :label="row.label" :bars="row.bars" />
               </GGanttChart>
          </div>
      </div>
  </div>
  <div v-else class="p-8 text-center text-gray-500">
      Cargando proyecto...
  </div>
</template>
