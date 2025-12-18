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
        return earliest.subtract(3, 'day').format(FORMAT)
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
    
    if (bar.ganttBarConfig.id.startsWith('vacation|')) return

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

    let newStartDate = dayjs(bar.from).startOf('day')
    while (newStartDate.day() === 0 || newStartDate.day() === 6) {
        newStartDate = newStartDate.add(1, 'day')
    }

    const days = hours / 8
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
        children: Array.from(new Set(props.project.requiredRoles.map(r => r.role.id)))
            .map(roleId => props.project.requiredRoles.find(r => r.role.id === roleId))
            .filter(Boolean)
            .flatMap(role => {
                const roleAllocations = props.project.allocations?.filter(a => a.roles?.some(r => r.id === role.role.id)) || []
                const collaborators = roleAllocations.map(a => a.collaborator).filter(Boolean)
                
                const uniqueCollaborators = []
                const seen = new Set()
                collaborators.forEach(c => {
                    if(!seen.has(c.id)) {
                        seen.add(c.id)
                        uniqueCollaborators.push(c)
                    }
                })

                const rows = []
                
                uniqueCollaborators.forEach(col => {
                    rows.push({
                        id: `${role.role.id}|${col.id}|${wp.id}`,
                        label: `${role.role.name} - ${col.firstName} ${col.lastName}`,
                        roleId: role.role.id,
                        collaboratorId: col.id
                    })
                })
                
                const singleCollaborator = uniqueCollaborators.length === 1 ? uniqueCollaborators[0] : null
                
                if (!singleCollaborator) {
                    rows.push({
                        id: `${role.role.id}|unassigned|${wp.id}`,
                        label: `${role.role.name} - Sin asignar`,
                        roleId: role.role.id,
                        collaboratorId: null
                    })
                }
                
                return rows.map(rowDef => {
                    const rowTasks = wp.tasks.filter(task => {
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

                    if (!rowDef.collaboratorId && rowTasks.length === 0) return null 
                    if (rowTasks.length === 0) return null

                    const bars = rowTasks.map(task => {
                            const estimation = task.estimations?.find(e => e.role.id === rowDef.roleId)
                            
                            let start = estimation?.startDate ? parseDateSafe(estimation.startDate) : (task.startDate ? parseDateSafe(task.startDate) : parseDateSafe(wp.startDate))
                            let end = estimation?.endDate ? parseDateSafe(estimation.endDate) : (start ? start.add(1, 'day') : null)
                            
                            if (!start || !start.isValid()) {
                                 start = dayjs(wp.startDate)
                            }
                            if (!end || !end.isValid()) {
                                 end = start.add(1, 'day')
                            }
                            
                            if (estimation?.hours && !estimation.endDate) {
                                 end = addBusinessDays(start, estimation.hours / 8) 
                            }

                            const isUnassigned = !estimation.collaborator
                            const barColor = isUnassigned ? '#9ca3af' : stringToColor(task.name+rowDef.roleId)

                            return {
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
                            }
                        })
                        
                    if (rowDef.collaboratorId) {
                        const col = uniqueCollaborators.find(c => c.id === rowDef.collaboratorId)
                        if (col && col.absences) {
                            col.absences.forEach(absence => {
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
                                            background: `repeating-linear-gradient(
                                                45deg,
                                                #e5e7eb,
                                                #e5e7eb 10px,
                                                #f3f4f6 10px,
                                                #f3f4f6 20px
                                            )`,
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
                    }

                    return {
                        id: rowDef.id,
                        label: rowDef.label,
                        bars
                    }
                }).filter(Boolean)
            })
    }))
})
</script>
