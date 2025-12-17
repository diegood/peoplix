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

const FORMAT = 'YYYY-MM-DD HH:mm'

const props = defineProps({
  project: { type: Object, required: true },
  workPackages: { type: Array, required: true }
})

const emit = defineEmits(['update-task-date'])

const parseDateSafe = (val) => {
    if (!isFinite(val)) return null
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return dayjs.utc(parseInt(val))
    }
    return dayjs(val)
}

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

/**
 * Funcion que calcula la fecha final de una tarea
 * @param {String} startDate 
 * @param {Number} hours 
 * @returns {String} endDate
 */
const addBusinessDays = (startDate, hours) => {
    let cursor = dayjs(startDate)
    //TODO magic number refactorizar ese *3 tendra que ser parametrizable por que puede ser jornadas de por ejemplo 6 horas  y varia el calculo
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

const setTaskDate = (taskId, dates) => {
    emit('update-task-date', { taskId, ...dates })
}

const handleDragEndBar = (e) => {
    const { bar } = e
    const [taskId, roleId] = bar.ganttBarConfig.id.split('|')
    const newStartDate = addBusinessDays(dayjs(bar.from).format(FORMAT), dayjs(bar.to).diff(bar.from, 'hour') / 3)

    emit('update-task-date', { taskId, startDate: newStartDate.format(FORMAT), endDate: bar.to })
}

const ganttRows = computed(() => {
    if (!props.project || !props.project.requiredRoles) return []

    return props.workPackages.map(wp => ({
        id: wp.id,
        label: wp.name,
        children: props.project.requiredRoles.map(role => {
            let lastEndDate = dayjs(Number(wp.startDate)).set('hour', 0)
            const calculateEndDate = (startDate, hours, taskId) => {
                const endDate = addBusinessDays(startDate, hours)
                lastEndDate = endDate
                // setTaskDate(taskId, {endDate: endDate.format(FORMAT), startDate: startDate.format(FORMAT)})
                return endDate
            }
            return {
                id: role.id+wp.id,
                label: role.role.name,
                bars: wp.tasks.map(task => ({
                        id: task.id+role.id,
                        label: task.name,
                        from: lastEndDate.format(FORMAT),
                        to: calculateEndDate(
                            lastEndDate,
                            task.estimations.find(e => e.role.id === role.role.id)?.hours,
                            task.id
                        ).format(FORMAT),
                        ganttBarConfig: {
                            id: task.id+role.role.id,
                            label: task.name,
                            style: { 
                                background: stringToColor(task.name+role.role.name),
                                borderRadius: '4px',
                                fontSize: '10px',
                                color: invertColor(stringToColor(task.name+role.role.name))
                            }
                        }
                }))
            }
        })
    }))

})
</script>
