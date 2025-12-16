<template>
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
</template>

<script setup>
import { computed } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import dayjs from '@/config/dayjs'

const props = defineProps({
  project: { type: Object, required: true },
  workPackages: { type: Array, required: true }
})

const emit = defineEmits(['update-task-date'])

const parseDateSafe = (val) => {
    if (!val) return null
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

const handleDragEndBar = (e) => {
    const { bar } = e
    const [taskId, roleId] = bar.ganttBarConfig.id.split('|')
    const newStartDate = dayjs(bar.myBeginDate).format('YYYY-MM-DD')
    
    // Emit event up to parent to handle mutation
    emit('update-task-date', { taskId, startDate: newStartDate })
}

const ganttRows = computed(() => {
    if (!props.project || !props.project.requiredRoles) return []

    const rows = []
    const roleRowMap = {}
    
    props.project.requiredRoles.forEach(req => {
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

    const allTasks = props.workPackages.flatMap(wp => 
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
