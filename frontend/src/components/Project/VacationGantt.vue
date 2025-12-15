<script setup>
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_ABSENCES } from '@/modules/Absences/graphql/absence.queries.js'
import { dayjs } from '@/config'

const props = defineProps({
    project: Object,
    currentDate: { type: Date, default: () => new Date() }
})

// Determine range: Start of month to End of +2 months
const start = dayjs(props.currentDate).startOf('month')
const end = start.add(3, 'month').endOf('month')

// Collaborator IDs
const collaboratorIds = computed(() => {
    return props.project?.allocations?.map(a => a.collaborator.id) || []
})

// Query Absences
const { result } = useQuery(GET_ABSENCES, () => ({
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
    // We want absences for ALL collaborators in this project. 
    // The query filter `projectId` might filter absences TIED to a project (if that existed), but absences are on collaborators.
    // If our backend `absences` query supports filtering by list of collaborators, great. If not, we fetch by Project? 
    // Backend `absences` query has `projectId` arg? Let's check typedefs.
    // Yes, `absences(collaboratorId: ID, projectId: ID, ...)`
    projectId: props.project.id
}))

const absences = computed(() => result.value?.absences || [])

// Timeline Days
const days = computed(() => {
    let d = start.clone()
    const list = []
    while (d.isBefore(end)) {
        list.push({
            date: d,
            label: d.date(),
            dayOfWeek: d.day(), // 0=Sun
            isWeekend: d.day() === 0 || d.day() === 6
        })
        d = d.add(1, 'day')
    }
    return list
})

const getAbsenceForDay = (collabId, dateDayjs) => {
    return absences.value.find(a => {
        if (a.collaborator.id !== collabId) return false
        const s = dayjs(a.startDate)
        const e = dayjs(a.endDate)
        return dateDayjs.isSame(s, 'day') || dateDayjs.isSame(e, 'day') || (dateDayjs.isAfter(s) && dateDayjs.isBefore(e))
    })
}
</script>

<template>
    <div class="overflow-x-auto">
        <div class="min-w-[800px]">
            <!-- Header Dates -->
            <div class="flex">
                <div class="w-48 shrink-0 p-2 font-bold bg-gray-50 border-b">Colaborador</div>
                <div class="flex-1 flex">
                    <div v-for="day in days" :key="day.date.toString()" 
                         class="w-8 shrink-0 text-center text-xs border-r border-b p-1"
                         :class="{'bg-gray-100': day.isWeekend, 'bg-blue-50 font-bold': day.date.date() === 1}">
                        {{ day.label }}
                    </div>
                </div>
            </div>

            <!-- Rows -->
            <div v-for="alloc in project.allocations" :key="alloc.id" class="flex border-b hover:bg-gray-50">
                <div class="w-48 shrink-0 p-2 flex items-center gap-2 border-r truncate">
                    <div class="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center">
                        {{ (alloc.collaborator.firstName || alloc.collaborator.userName)?.[0] }}
                    </div>
                    <span class="text-sm truncate">{{ alloc.collaborator.firstName }} {{ alloc.collaborator.lastName }}</span>
                </div>
                <div class="flex-1 flex relative">
                   <div v-for="day in days" :key="day.date.toString()" 
                         class="w-8 shrink-0 border-r h-8 relative"
                         :class="{'bg-gray-100': day.isWeekend}">
                        
                        <template v-if="getAbsenceForDay(alloc.collaborator.id, day.date)">
                             <!-- Absence Bar Part -->
                             <div class="absolute inset-0 m-0.5 rounded opacity-80"
                                  :class="{
                                     'rounded-l-md': getAbsenceForDay(alloc.collaborator.id, day.date).startDate === day.date.format('YYYY-MM-DD'),
                                     'rounded-r-md': getAbsenceForDay(alloc.collaborator.id, day.date).endDate === day.date.format('YYYY-MM-DD')
                                  }"
                                  :style="{ backgroundColor: getAbsenceForDay(alloc.collaborator.id, day.date).type.color }"
                                  :title="getAbsenceForDay(alloc.collaborator.id, day.date).type.name">
                             </div>
                        </template>

                   </div>
                </div>
            </div>
        </div>
    </div>
</template>
