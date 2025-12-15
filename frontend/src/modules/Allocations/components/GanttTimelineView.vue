<script setup>
import { computed} from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import { dayjs } from '@/config'

const FORMAT = 'YYYY-MM-DD HH:mm'

const props = defineProps({
    projects: { type: Array, default: () => [] },
    absences: { type: Array, default: () => [] },
    chartStart: { type: String, required: true },
    chartEnd: { type: String, required: true }
})

const ganttRows = computed(() => {
    const rows = []
    
    props.projects.forEach(project => {
        rows.push({
            id: `proj-${project.id}`,
            label: project.name,
            bars: project.milestones.map(m => {
                return {
                    from: dayjs(m.date).set('hour', 0).format(FORMAT),
                    to: dayjs(m.date).set('hour', 23).format(FORMAT),
                    ganttBarConfig: {
                        id: m.id,
                        label: m.name,
                        style: { 
                            background: m.milestoneType?.color || '#42b883',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '10px'
                        }
                    }
                }
            }),
            isGroup: true
        })
        
        const allocatedCollabs = []
        const seen = new Set()
        
        project.allocations?.forEach(alloc => {
             if (alloc.collaborator && !seen.has(alloc.collaborator.id)) {
                 seen.add(alloc.collaborator.id)
                 allocatedCollabs.push(alloc.collaborator)
             }
        })
        
        allocatedCollabs.forEach(collab => {
            const myAbsences = props.absences.filter(a => a.collaboratorId === collab.id)
            
            const bars = myAbsences.map(abs => {
                return {
                     from: abs.startDate,
                     to: abs.endDate,
                     ganttBarConfig: {
                         id: abs.id,
                         label: abs.type.name,
                         style: {
                             background: abs.type.color || '#ccc',
                             borderRadius: '4px',
                             color: 'white',
                             fontSize: '10px'
                         }
                     }
                }
            })
            
            rows.push({
                id: `p-${project.id}-c-${collab.id}`,
                label: `  ↳ ${collab.firstName} ${collab.lastName}`,
                bars: bars,
                isGroup: false
            })
        })
    })
    
    return rows
})

const chartStartParsed = computed(() => dayjs(props.chartStart).format(FORMAT))
const chartEndParsed = computed(() => dayjs(props.chartEnd).format(FORMAT))

</script>

<template>
    <div class="h-full w-full overflow-hidden flex flex-col">
        <GGanttChart
            :chart-start="chartStartParsed"
            :chart-end="chartEndParsed"
            :precision="'day'"
            bar-start="from"
            bar-end="to"
            push-on-overlap
            font="Inter"
            :auto-scroll-to-today="true"
            :date-format="FORMAT"
        >
            <GGanttRow
                v-for="row in ganttRows"
                :key="row.id"
                :label="row.label"
                :bars="row.bars"
                :highlight-on-hover="true"
            />
        </GGanttChart>
    </div>
</template>