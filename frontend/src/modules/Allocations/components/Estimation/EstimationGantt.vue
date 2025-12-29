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
                :auto-scroll-to-today="true"
                :date-format="FORMAT"
                locale="es"
                color-scheme="default"
                grid
                holiday-highlight="ES"
                :highlighted-days-in-week="[0, 6]"
                label-column-title="Nombre"
                :current-time="true"
                currentTimeLabel="Ahora"
                :show-group-label="false"
                :show-progress="true"
                :default-progress-resizable="true"
                @dragend-bar="handleDragEndBar"
                :utc="true"
                :noOverlap="false"
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
import { parseDateSafe, addWorkingDays, isWorkingDay, getDailySchedule } from '@/helper/Date'
import { getBlockedDates, getComputedSchedule } from '@/modules/Allocations/helpers/estimationHelpers'
import { DATE_TIME_FORMAT_API, DATE_FORMAT_API } from '@/config/constants'
 
const FORMAT = DATE_TIME_FORMAT_API

const props = defineProps({
  project: { type: Object, required: true },
  workPackages: { type: Array, required: true }
})

const emit = defineEmits(['update-task-date'])

// --- Configuration Computed ---

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
        return earliest.subtract(3, 'day').format(FORMAT)
    }
    return dayjs().startOf('month').format(FORMAT)
})

const chartEnd = computed(() => {
    return dayjs(chartStart.value).add(3, 'month').format(FORMAT)
})


const getCollaboratorMetadata = (collaborator) => {
    if (!collaborator) return { blockedDates: [], schedule: null }
    return {
        blockedDates: getBlockedDates(collaborator),
        schedule: getComputedSchedule(collaborator)
    }
}

const getUniqueCollaboratorsForRole = (roleId, allocations) => {
    const roleAllocations = allocations?.filter(a => a.roles?.some(r => r.id === roleId)) || []
    const collaborators = roleAllocations.map(a => a.collaborator).filter(Boolean)
    
    const unique = []
    const seen = new Set()
    collaborators.forEach(c => {
        if(!seen.has(c.id)) {
            seen.add(c.id)
            unique.push(c)
        }
    })
    return unique
}

const getPersonalHolidays = (collaborator) => {
    let holidays = []
    if (collaborator.holidayCalendar && collaborator.holidayCalendar.holidays) {
        let hList = collaborator.holidayCalendar.holidays
        if (typeof hList === 'string') {
            try { hList = JSON.parse(hList) } catch { /* ignore */ }
        }
        if (Array.isArray(hList)) holidays = [...hList]
    }
    return holidays
}

const getPublicHolidays = (collaborator) => {
    let holidays = []
    if (collaborator.workCenter && collaborator.workCenter.publicHolidayCalendars) {
        collaborator.workCenter.publicHolidayCalendars.forEach(cal => {
            if (cal.holidays && Array.isArray(cal.holidays)) {
                holidays = [...holidays, ...cal.holidays]
            }
        })
    }
    return holidays
}

const deduplicateHolidays = (holidays) => {
    const uniqueHolidays = []
    const seenDates = new Set()
    holidays.forEach(h => {
        const d = h.date || h
        if (!seenDates.has(d)) {
            seenDates.add(d)
            uniqueHolidays.push(h)
        }
    })
    return uniqueHolidays
}

const HOLIDAY_STYLE = {
    background: `repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px)`,
    color: '#991b1b',
    fontSize: '9px',
    borderRadius: '4px',
    border: '1px solid #f87171',
    opacity: 0.8
}

const createHolidayBar = (h, idx, collaboratorId, rowDefId) => {
    const dateStr = h.date || h
    if (!dateStr) return null
    
    const hDate = dayjs(dateStr)
    if (!hDate.isValid()) return null

    return {
        id: `holiday|${collaboratorId}|${dateStr}|${idx}|${rowDefId}`,
        label: h.name || 'Festivo',
        from: hDate.format(FORMAT),
        to: hDate.add(1, 'day').subtract(1, 'minute').format(FORMAT),
        ganttBarConfig: {
            id: `holiday|${collaboratorId}|${dateStr}|${idx}|${rowDefId}`,
            label: h.name || 'Festivo',
            immobile: true,
            style: HOLIDAY_STYLE
        }
    }
}

const generateHolidayBars = (collaborator, rowDef) => {
    let holidays = [
        ...getPersonalHolidays(collaborator),
        ...getPublicHolidays(collaborator)
    ]
    
    const uniqueHolidays = deduplicateHolidays(holidays)

    return uniqueHolidays.map((h, idx) => 
        createHolidayBar(h, idx, collaborator.id, rowDef.id)
    ).filter(Boolean)
}

const generateAbsenceBars = (collaborator, rowDef) => {
    const bars = []
    if (collaborator.absences) {
        collaborator.absences.forEach(absence => {
            bars.push({
                id: `vacation|${absence.id}|${rowDef.id}`,
                label: 'Vacaciones', 
                from: dayjs(absence.startDate).format(FORMAT),
                to: dayjs(absence.endDate).format(FORMAT),
                ganttBarConfig: {
                    id: `vacation|${absence.id}|${rowDef.id}`,
                    label: absence.type?.name || 'Ausencia',
                    immobile: true, 
                    style: {
                        background: `repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 10px, #f3f4f6 10px, #f3f4f6 20px)`,
                        color: '#6b7280',
                        fontSize: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        opacity: 0.8
                    }
                }
            })
        })
    }
    return bars
}

const generateTaskBars = (tasks, rowDef, wpStartDate, collaborator) => {
    const bars = []
    tasks.forEach(task => {
        const estimation = task.estimations?.find(e => e.role.id === rowDef.roleId)
        
        let start = estimation?.startDate ? parseDateSafe(estimation.startDate) : (task.startDate ? parseDateSafe(task.startDate) : parseDateSafe(wpStartDate))
        let end = estimation?.endDate ? parseDateSafe(estimation.endDate) : (start ? start.add(1, 'day') : null)
        
        if (!start || !start.isValid()) {
                start = dayjs(wpStartDate)
        }
        if (!end || !end.isValid()) {
                end = start.add(1, 'day')
        }
        
        const { blockedDates, schedule } = getCollaboratorMetadata(collaborator)
        
        if (estimation?.hours && !estimation.endDate) {
             end = addWorkingDays(start, estimation.hours, blockedDates, schedule) 
        }

        if (end) {
            const daySched = getDailySchedule(end, schedule)
            if (daySched.active) {
                const [endH] = daySched.end.split(':').map(Number)
                // Relaxed Check: If 'end' time is close enough to schedule end (within 1 hour)
                // This forces "Full Day" visualization for 8h tasks in 9h schedules (ending 17:00 when sched ends 18:00).
                if (end.hour() >= (endH - 1)) {
                        end = end.endOf('day')
                }
            }
        }

        const isUnassigned = !estimation.collaborator
        const barColor = isUnassigned ? '#9ca3af' : stringToColor(task.name+rowDef.roleId)

        bars.push({
            id: task.id + '|' + rowDef.roleId,
            label: task.name,
            from: start.format(FORMAT),
            to: end.format(FORMAT),
            ganttBarConfig: {
                id: task.id + '|' + rowDef.roleId,
                label: task.name,
                style: { 
                    background: barColor,
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: invertColor(barColor),
                    border: isUnassigned ? '1px dashed #4b5563' : 'none'
                }
            }
        })
    })
    return bars
}

const generateRowDefinitions = (role, wpId, uniqueCollaborators) => {
    const rows = []
    
    uniqueCollaborators.forEach(col => {
        rows.push({
            id: `${role.role.id}|${col.id}|${wpId}`,
            label: `${role.role.name} - ${col.firstName} ${col.lastName}`,
            roleId: role.role.id,
            collaboratorId: col.id
        })
    })
    
    const singleCollaborator = uniqueCollaborators.length === 1 ? uniqueCollaborators[0] : null
    
    if (!singleCollaborator) {
        rows.push({
            id: `${role.role.id}|unassigned|${wpId}`,
            label: `${role.role.name} - Sin asignar`,
            roleId: role.role.id,
            collaboratorId: null
        })
    }
    return rows
}

const filterTasksForRow = (wpTasks, rowDef, singleCollaborator) => {
    return wpTasks.filter(task => {
        const est = task.estimations?.find(e => e.role.id === rowDef.roleId)
        if (!est) return false
        
        if (singleCollaborator && rowDef.collaboratorId === singleCollaborator.id) {
                const isAssignedToMe = est.collaborator?.id === rowDef.collaboratorId
                const isUnassigned = !est.collaborator
                return isAssignedToMe || isUnassigned
        }

        if (rowDef.collaboratorId) {
            return est.collaborator?.id === rowDef.collaboratorId
        }
        return !est.collaborator
    })
}


const ganttRows = computed(() => {
    if (!props.project || !props.project.requiredRoles) return []

    return props.workPackages.map(wp => {
        const children = []
        const roles = Array.from(new Set(props.project.requiredRoles.map(r => r.role.id)))
            .map(roleId => props.project.requiredRoles.find(r => r.role.id === roleId))
            .filter(Boolean)
        
        roles.forEach(role => {
            const uniqueCollaborators = getUniqueCollaboratorsForRole(role.role.id, props.project.allocations)
            const singleCollaborator = uniqueCollaborators.length === 1 ? uniqueCollaborators[0] : null 
            const rowDefs = generateRowDefinitions(role, wp.id, uniqueCollaborators)
            
            rowDefs.forEach(rowDef => {
                const rowTasks = filterTasksForRow(wp.tasks, rowDef, singleCollaborator)
                if ((!rowDef.collaboratorId && rowTasks.length === 0) || (rowDef.collaboratorId && rowTasks.length === 0)) {
                    if(!rowDef.collaboratorId && rowTasks.length === 0) return 
                    if(rowTasks.length === 0) return 
                }
                
                let bars = []
                let collaborator = null
                
                if (rowDef.collaboratorId) {
                    collaborator = uniqueCollaborators.find(c => c.id === rowDef.collaboratorId)
                    if (collaborator) {
                        bars = [...bars, ...generateAbsenceBars(collaborator, rowDef)]
                        bars = [...bars, ...generateHolidayBars(collaborator, rowDef)]
                    }
                }
                
                bars = [...bars, ...generateTaskBars(rowTasks, rowDef, wp.startDate, collaborator)]
                
                children.push({
                    id: rowDef.id,
                    label: rowDef.label,
                    bars
                })
            })
        })
        
        return {
            id: wp.id,
            label: wp.name,
            children
        }
    })
})


const resolveEstimationFromConfigId = (configId, workPackages) => {
    const [taskId, roleId] = configId.split('|')
    let hours = 0
    let estimation = null
    
    for (const wp of workPackages) {
        const t = wp.tasks?.find(task => task.id === taskId)
        if (t) {
            estimation = t.estimations?.find(est => est.role.id === roleId)
            if (estimation) hours = estimation.hours
            break
        }
    }
    return { taskId, roleId, hours, estimation }
}

const getSiblingBars = (rows, configId) => {
    let siblingBars = []
    rows.forEach(wp => {
        wp.children?.forEach(group => { 
                if (group.bars?.some(b => b.ganttBarConfig.id === configId)) {
                    siblingBars = group.bars.filter(b => b.ganttBarConfig.id !== configId)
                }
        })
    })
    return siblingBars
}

const resolveCollision = (startDate, hours, blockedDates, schedule, siblingBars) => {
    let currentStart = startDate
    const blockedSet = new Set(blockedDates)

    for(let i=0; i<5; i++) {
        let overlapFound = false
        const tentativeEnd = addWorkingDays(currentStart, hours, blockedDates, schedule)
        
        for (const otherBar of siblingBars) {
                const otherStart = parseDateSafe(otherBar.from)
                const otherEnd = parseDateSafe(otherBar.to)
                
                if (currentStart.isBefore(otherEnd) && tentativeEnd.isAfter(otherStart)) {
                    if (currentStart.isAfter(otherStart) || currentStart.isSame(otherStart)) {
                        currentStart = otherEnd
                        while (!isWorkingDay(currentStart, schedule) || blockedSet.has(currentStart.format(DATE_FORMAT_API))) {
                             currentStart = currentStart.add(1, 'day').startOf('day')
                        }
                        overlapFound = true
                        break 
                    }
                }
        }
        if (!overlapFound) break
    }
    return currentStart
}

const handleDragEndBar = (e) => {
    const { bar } = e
    if (!bar || !bar.ganttBarConfig) return
    const configId = bar.ganttBarConfig.id
    
    if (configId.startsWith('vacation|') || configId.startsWith('holiday|')) return

    const { taskId, roleId, hours, estimation } = resolveEstimationFromConfigId(configId, props.workPackages)
    
    let newStartDate = dayjs(bar.from)
    const collaboratorId = estimation?.collaborator?.id
    
    let blockedDates = []
    let schedule = null
    
    if (collaboratorId && props.project?.allocations) {
        const alloc = props.project.allocations.find(a => a.collaborator.id === collaboratorId)
        if (alloc?.collaborator) {
           const meta = getCollaboratorMetadata(alloc.collaborator)
           blockedDates = meta.blockedDates
           schedule = meta.schedule
        }
    }

    const blockedSet = new Set(blockedDates)
    while (!isWorkingDay(newStartDate, schedule) || blockedSet.has(newStartDate.format(DATE_FORMAT_API))) {
        newStartDate = newStartDate.add(1, 'day').startOf('day')
    }

    const siblingBars = getSiblingBars(ganttRows.value, configId)
    newStartDate = resolveCollision(newStartDate, hours, blockedDates, schedule, siblingBars)

    const newEndDate = addWorkingDays(newStartDate, hours, blockedDates, schedule)

    emit('update-task-date', { 
        taskId, 
        roleId, 
        hours, 
        startDate: newStartDate.format(FORMAT), 
        endDate: newEndDate.format(FORMAT) 
    })
}
</script>
