<script setup>
import { computed, ref} from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import { dayjs } from '@/config'

const FORMAT = 'YYYY-MM-DD HH:mm'

const props = defineProps({
    project: { type: Object, required: true },
    absences: { type: Array, default: () => [] },
    chartStart: { type: String, required: true },
    chartEnd: { type: String, required: true }
})

const events = computed(() => {
    return props.project.milestones.map(m =>({
        id: m.id,
        date: m.date,
        startDate: dayjs(m.date).set('hour', 0).format(FORMAT),
        endDate: dayjs(m.date).set('hour', 23).format(FORMAT),
        backgroundColor: m.milestoneType?.color || '#42b883',
        label: m.milestoneType.name,
        description: m.name,
    }))
})

const ganttRows = computed(() => {
        return [{
            id: `proj-${props.project.id}`,
            label: props.project.name,
            bars: props.project.milestones.map(m => {
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
            children: makeChildren()
        },
        {
            id: `ausencias-${props.project.id}`,
            label: 'Ausencias',
            children: collaboratorsWithAbsencesGantt() || []
        }]
})

const makeChildren = () => {
    const children =[projectTasksGantt()]
    return children
}

const projectTasksGantt = () => {
    return {
        id: `proj-${props.project.id}-m-events`,
        label: 'Eventos',
        bars: props.project.milestones.map(m => 
            ({
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
            })
        )
    }
}

const collaboratorsWithAbsencesGantt = () => {
    return props.absences.filter(abs => props.project.allocations.some(a => a.collaborator.id === abs.collaborator.id)).map(abs => {
                return {
                    id: `proj-${props.project.id}-c-${abs.collaborator.id}`,
                    label: `${abs.collaborator.firstName} ${abs.collaborator.lastName}`,
                    bars: [
                        {
                            from: abs.startDate,
                            to: abs.endDate,
                            ganttBarConfig: {
                                id: abs.id,
                                label: abs.type.name,
                                progress: 12,
                                style: {
                                    background: abs.type.color || '#ccc',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '10px'
                                }
                            }
                        }
                    ]
                }
            })
}

const chartStartParsed = computed(() => dayjs(props.chartStart).format(FORMAT))
const chartEndParsed = computed(() => dayjs(props.chartEnd).format(FORMAT))

</script>

<template>
    <div>
        <h2>{{ props.project.name }}</h2>
    </div>
    <div class="h-full w-full overflow-hidden flex flex-col">
        <g-gantt-chart
            :chart-start="chartStartParsed"
            :chart-end="chartEndParsed"
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
            :timeaxis-events="events"
            :showEventsAxis="true"
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
                <template #timeaxis-event="{ event }">
                    <div class="custom-timeaxis-event">
                        <span class="event-dot" :style="{ background: event.backgroundColor || '#42b883' }"></span>
                        <span class="event-label">{{ event.label }}</span>
                    </div>
                </template>

                <!-- <template #group-bar="{ width, height, bar }">
                    <div class="custom-group-bar" :style="{ width: width + 'px', height: height + 'px' }">
                        <div class="group-header" :style="{ background: bar.ganttBarConfig.style?.background || '#35495e' }">
                        {{ bar.ganttBarConfig.label }}
                        </div>
                        <div class="group-progress-container">
                        <div 
                            class="group-progress" 
                            :style="{ 
                            width: (bar.ganttBarConfig.progress || 0) + '%',
                            background: bar.ganttBarConfig.style?.background ? `${bar.ganttBarConfig.style.background}aa` : '#35495eaa'
                            }"
                        ></div>
                        </div>
                    </div>
                </template> -->
            </g-gantt-row>
        </g-gantt-chart>
    </div>
</template>
<style>
/* .custom-group-bar {
  display: flex;
  flex-direction: column;
  border-radius: 0;
  overflow: hidden;
  box-shadow: unset;
}

.group-header {
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: black;
  font-weight: bold;
  font-size: 11px;
}

.group-progress-container {
  height: 40%;
  background: rgba(69, 68, 68, 0.2);
}

.group-progress {
  height: 100%;
  transition: width 0.3s ease;
} */
</style>
