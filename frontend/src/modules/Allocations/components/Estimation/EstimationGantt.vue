<template>
  <div class="mt-8 bg-white p-4 rounded-xl shadow-sm" v-if="ganttRows.length > 0">
      <h3 class="font-bold text-gray-700 mb-4">Gráfico Gantt del Proyecto</h3>
      <div class="h-[400px] overflow-hidden">
            <GGanttChart
                :chart-start="chartStart"
                :chart-end="chartEnd"
                :precision="'day'"
                bar-start="from"
                bar-end="to"
                push-on-overlap
                :auto-scroll-to-today="true"
                :date-format="FORMAT"
                locale="es"
                color-scheme="default"
                grid
                holiday-highlight="ES"
                :highlighted-days-in-week="[0, 6]"
                label-column-title="Nombre"
                :current-time="true"
                :show-group-label="false"
                :show-progress="true"
                :default-progress-resizable="true"
                @dragend-bar="handleDragEndBar"
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import dayjs from '@/config/dayjs'
import { stringToColor, invertColor } from '@/helper/Colors'
import { parseDateSafe, addBusinessDays } from '@/helper/Date'

const FORMAT = 'YYYY-MM-DD HH:mm'

const props = defineProps({
  project: { type: Object, required: true },
  workPackages: { type: Array, required: true }
})

const emit = defineEmits(['update-task-date'])

const chartStart = computed(() => {
    let earliest = null
    props.workPackages.forEach(wp => {
        const d = parseDateSafe(wp.startDate)
        if (d && d.isValid()) {
            if (!earliest || d.isBefore(earliest)) {
                earliest = d
            }
        }
    })
    
    if (earliest) {
        return earliest.format(FORMAT)
    }
    return dayjs().startOf('month').format(FORMAT)
})

const chartEnd = computed(() => {
    return dayjs(chartStart.value).add(3, 'month').format(FORMAT)
})



const setTaskDate = (taskId, dates) => {
    emit('update-task-date', { taskId, ...dates })
}

const handleDragEndBar = (e) => {
    const { bar } = e
    console.log('[DEBUG Gantt] handleDragEndBar', bar)
    const [taskId, roleId] = bar.ganttBarConfig.id.split('|')
    
    let hours = 0
    for (const wp of props.workPackages) {
        const task = wp.tasks?.find(t => t.id === taskId)
        if (task) {
            const est = task.estimations?.find(est => est.role.id === roleId)
            if (est) hours = est.hours
            break
        }
    }

    // Enforce business days for Start Date
    let newStartDate = dayjs(bar.from)
    while (newStartDate.day() === 0 || newStartDate.day() === 6) {
        newStartDate = newStartDate.add(1, 'day')
    }

    // Recalculate End Date based on hours to maintain duration consistency
    // Note: addBusinessDays expects 'days' (hours/3), but here we might just want to shift the end date?
    // User requested "no puede comenzar un sabado ni domingo".
    // If we shift start, we should shift end to keep duration.
    // Using addBusinessDays ensures the duration respects business days too.
    const days = hours / 3
    const newEndDate = addBusinessDays(newStartDate, days)

    console.log('[DEBUG Gantt] Adjusted Dates:', { 
        originalFrom: bar.from, 
        newStart: newStartDate.format(FORMAT), 
        newEnd: newEndDate.format(FORMAT) 
    })

    emit('update-task-date', { 
        taskId, 
        roleId, 
        hours, 
        startDate: newStartDate.format(FORMAT), 
        endDate: newEndDate.format(FORMAT) 
    })
}

const ganttRows = computed(() => {
    if (!props.project || !props.project.requiredRoles) return []

    return props.workPackages.map(wp => ({
        id: wp.id,
        label: wp.name,
        children: props.project.requiredRoles.map(role => {
            return {
                id: role.id+wp.id,
                label: role.role.name,
                bars: wp.tasks.map(task => {
                        const estimation = task.estimations?.find(e => e.role.id === role.role.id)
                        
                        let start = estimation?.startDate ? parseDateSafe(estimation.startDate) : (task.startDate ? parseDateSafe(task.startDate) : parseDateSafe(wp.startDate))
                        let end = estimation?.endDate ? parseDateSafe(estimation.endDate) : (start ? start.add(1, 'day') : null)
                        
                        if (!start || !start.isValid()) {
                             start = dayjs(wp.startDate)
                        }
                        if (!end || !end.isValid()) {
                             end = start.add(1, 'day')
                        }
                        
                        if (estimation?.hours && !estimation.endDate) {
                             end = addBusinessDays(start, estimation.hours / 3) 
                        }

                        return {
                            id: task.id + '|' + role.role.id,
                            label: task.name,
                            from: start.format(FORMAT),
                            to: end.format(FORMAT),
                            ganttBarConfig: {
                                id: task.id + '|' + role.role.id,
                                label: task.name,
                                style: { 
                                    background: stringToColor(task.name+role.role.name),
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    color: invertColor(stringToColor(task.name+role.role.name))
                                }
                            }
                        }
                }).filter(bar => {
                    const task = wp.tasks.find(t => t.id === bar.id.split('|')[0])
                    return task?.estimations?.some(e => e.role.id === role.role.id)
                })
            }
        })
    }))

})
</script>
