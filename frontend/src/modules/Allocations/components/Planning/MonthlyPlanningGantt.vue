<template>
  <div class="mt-4 bg-white p-4 rounded-xl shadow-sm h-full flex flex-col relative">
      <div v-if="ganttRows.length === 0" class="text-center text-gray-400 py-10">
          No hay proyectos con cargas de trabajo pendientes.
      </div>
      <div v-else class="flex-1 overflow-hidden relative">
            <GGanttChart
                :chart-start="chartStart"
                :chart-end="chartEnd"
                :precision="'day'"
                bar-start="from"
                bar-end="to"
                :auto-scroll-to-today="true"
                :date-format="FORMAT"
                locale="es"
                color-scheme="default"
                grid
                holiday-highlight="ES"
                :highlighted-days-in-week="[0, 6]"
                label-column-title="Proyecto / Rol"
                :current-time="true"
                currentTimeLabel="Ahora"
                :show-group-label="false"
                :show-progress="true"
                :default-progress-resizable="true"
                @dragend-bar="handleDragEndBar"
                @click-bar="handleClickBar"
                :utc="true"
                class="h-full"
            >
                <g-gantt-row
                    v-for="row in ganttRows"
                    :key="row.id"
                    :id="row.id"
                    :label="row.label"
                    :bars="row.bars || []"
                    :highlight-on-hover="true"
                    :children="row.children || []"
                >
                </g-gantt-row>
           </GGanttChart>
      </div>

      <!-- Context Menu/Modal for Status -->
      <div v-if="selectedTask" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-xl p-6 w-[450px] max-w-full shadow-2xl relative">
               <button @click="selectedTask = null" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                   <span class="text-2xl">&times;</span>
               </button>
               
               <h3 class="text-xl font-bold mb-1 text-gray-800">{{ selectedTask.name }}</h3>
               <div class="text-sm text-gray-500 mb-6 flex items-center gap-2">
                   <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">WP: {{ selectedTask.wpName }}</span>
               </div>
               
               <div class="space-y-6">
                   <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                       <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estado Actual</label>
                       <div class="flex items-center gap-2">
                           <div class="w-3 h-3 rounded-full" 
                                :class="{
                                   'bg-gray-400': !selectedTask.status || selectedTask.status === 'BACKLOG',
                                   'bg-yellow-400': selectedTask.status === 'TO_DO' || selectedTask.status === 'TODO' || selectedTask.status === 'Por hacer',
                                   'bg-blue-500': selectedTask.status === 'IN_PROGRESS' || selectedTask.status === 'EN_PROGRESO',
                                   'bg-green-500': selectedTask.status === 'DONE'
                                }"></div>
                           <span class="font-medium text-gray-900">{{ selectedTask.status || 'BACKLOG' }}</span>
                       </div>
                   </div>

                   <div>
                       <label class="block text-sm font-medium text-gray-700 mb-2">Cambiar Estado</label>
                       <select v-model="selectedTaskNewStatus" class="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                           <option value="BACKLOG">Backlog</option>
                           <option value="TO_DO">Por hacer (To Do)</option>
                           <option value="IN_PROGRESS">En Progreso</option>
                           <option value="DONE">Hecho (Terminado)</option>
                       </select>
                       <p class="text-xs text-gray-500 mt-2">
                           Mover a "Hecho" eliminará este elemento de la vista de planificación.
                       </p>
                   </div>
               </div>

               <div class="mt-8 flex justify-end gap-3 border-t pt-4">
                   <button @click="selectedTask = null" class="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                   <button @click="saveStatus" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all transform active:scale-95">Guardar Cambios</button>
               </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import dayjs from '@/config/dayjs'
import { stringToColor, invertColor } from '@/helper/Colors'
import { parseDateSafe } from '@/helper/Date'

const FORMAT = 'YYYY-MM-DD HH:mm'

const props = defineProps({
  projects: { type: Array, required: true }
})

const emit = defineEmits(['update-work-package-status'])

const selectedTask = ref(null)
const selectedTaskNewStatus = ref('')

// Calculate chart boundaries
const chartStart = computed(() => {
    let earliest = null
    props.projects.forEach(p => {
        p.workPackages.forEach(wp => {
            wp.tasks?.forEach(t => {
                t.estimations?.forEach(e => {
                     const d = parseDateSafe(e.startDate)
                     if (d && d.isValid()) {
                         if (!earliest || d.isBefore(earliest)) earliest = d
                     }
                })
            })
        })
    })
    
    if (earliest) {
        return earliest.subtract(7, 'day').format(FORMAT)
    }
    return dayjs().startOf('month').subtract(1, 'week').format(FORMAT)
})

const chartEnd = computed(() => {
    let latest = dayjs(chartStart.value).add(3, 'month') 
    props.projects.forEach(p => {
        p.workPackages.forEach(wp => {
             wp.tasks?.forEach(t => {
                t.estimations?.forEach(e => {
                     const d = parseDateSafe(e.endDate)
                     if (d && d.isValid() && d.isAfter(latest)) latest = d
                })
            })
        })
    })

    return latest.add(2, 'week').format(FORMAT)
})

const ganttRows = computed(() => {
    return props.projects.map(project => {
        // Create rows for each UNIQUE required role in the project
        const roleChildren = (project.requiredRoles || []).map(rr => {
             const roleId = rr.role.id
             const roleName = rr.role.name
             
             // Collect all estimations for this role across all WPs of this project
             const bars = []
             project.workPackages.forEach(wp => {
                 wp.tasks?.forEach(task => {
                     task.estimations?.filter(e => e.role.id === roleId).forEach(est => {
                         const start = parseDateSafe(est.startDate) || parseDateSafe(task.startDate) || parseDateSafe(wp.startDate) || dayjs()
                         let end = parseDateSafe(est.endDate) || parseDateSafe(task.endDate) 
                         
                         if (!end || !end.isValid()) {
                             end = start.add(est.hours ? est.hours / 8 : 1, 'day')
                         }
                         
                         const barColor = stringToColor(wp.name) // Color task by WP to group visually
                         
                         bars.push({
                             id: `${wp.id}|${task.id}|${est.id}`,
                             label: task.name,
                             from: start.format(FORMAT),
                             to: end.format(FORMAT),
                             ganttBarConfig: {
                                 id: `${wp.id}|${task.id}|${est.id}`,
                                 label: task.name,
                                 style: {
                                     background: barColor,
                                     color: invertColor(barColor),
                                     borderRadius: '4px',
                                     fontSize: '11px',
                                     cursor: 'pointer'
                                 },
                                 status: wp.status,
                                 wpName: wp.name,
                                 taskId: task.id,
                                 wpId: wp.id
                             }
                         })
                     })
                 })
             })
             
             if (bars.length === 0) return null

             return {
                 id: `${project.id}-${roleId}`,
                 label: roleName,
                 bars: bars
             }
        }).filter(Boolean)

        // If no roles defined or no estimations, maybe display WPs directly? Requires User Check.
        // But user specifically asked for segmentation by Role.
        
        return {
            id: project.id,
            label: project.name,
            children: roleChildren, 
            bars: [] 
        }
    })
})

const handleDragEndBar = (e) => {
    // Implement dragging logic if needed OR disable dragging if it's just planning view
    // For now, logged but logic is complex (moving estimation requires API)
    // We reuse existing logic if user wants drag.
    console.log('Drag end', e)
}

const handleClickBar = (e) => {
    const { bar } = e
    selectedTask.value = {
        name: bar.ganttBarConfig.label,
        wpName: bar.ganttBarConfig.wpName,
        status: bar.ganttBarConfig.status,
        wpId: bar.ganttBarConfig.wpId
    }
    selectedTaskNewStatus.value = bar.ganttBarConfig.status || 'BACKLOG'
}

const saveStatus = () => {
    if (selectedTask.value) {
        emit('update-work-package-status', {
            id: selectedTask.value.wpId,
            status: selectedTaskNewStatus.value
        })
        selectedTask.value = null
    }
}
</script>

<style scoped>
:deep(.g-gantt-chart) {
    height: 100%;
}
</style>
