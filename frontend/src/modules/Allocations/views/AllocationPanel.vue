<script setup>
import { computed, ref, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import {
    GET_PROJECTS,
    GET_COLLABORATORS
} from '@/modules/Allocations/graphql/allocation.queries'
import { GET_ABSENCES } from '@/modules/Absences/graphql/absence.queries'
import { dayjs } from '@/config'
import { useNotificationStore } from '@/stores/notificationStore'
import { useWeekNavigation } from '../composables/useWeekNavigation'
import { useAllocationActions } from '../composables/useAllocationActions'

import AllocationHeader from '../components/AllocationHeader.vue'
import GlobalMilestonesSummary from '../components/GlobalMilestonesSummary.vue'
import CollaboratorPool from '../components/CollaboratorPool.vue'
import ProjectAllocationCard from '../components/ProjectAllocationCard.vue'
import GanttTimelineView from '../components/GanttTimelineView.vue'
import AssignmentModal from '../forms/AssignmentModal.vue'

import MilestoneManager from '@/modules/Configuration/components/MilestoneManager.vue'
import HierarchyManager from '@/components/HierarchyManager.vue'

const notificationStore = useNotificationStore()

const hierarchyModalOpen = ref(false)
const managerOpen = ref(false)
const selectedHierarchyProjectId = ref(null)

const dragging = ref(false)
const localProjects = ref([])
const viewMode = ref('weekly')
const zoomLevel = ref('month')

const {
    selectedWeek,
    monthlyRange,
    isAllocationActiveInWeek,
    gotToWeek,
    getPrevWeek
} = useWeekNavigation()

const {
    confirmAssignment: performAssignment,
    deleteAlloc,
    updateAllocationPercentage: performUpdatePercentage,
    addRole,
    removeRole
} = useAllocationActions()

const assignmentModalOpen = ref(false)
const assignmentContext = ref({
    projectId: null,
    collaborator: null
})

const { result: projectResult, loading: projectsLoading } = useQuery(GET_PROJECTS, null, { fetchPolicy: 'cache-and-network' })
const availableOnly = ref(true)
const { result: collabResult, loading: collabsLoading } = useQuery(GET_COLLABORATORS, () => ({ availableOnly: availableOnly.value, week: selectedWeek.value }))

const { result: absencesResult } = useQuery(GET_ABSENCES, () => ({
    startDate: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'year').format('YYYY-MM-DD')
}))
const absences = computed(() => absencesResult.value?.absences || [])

watch(projectResult, (newVal) => {
  if (newVal?.projects) {
     const clean = JSON.parse(JSON.stringify(newVal.projects))
     clean.forEach(p => {
         if (!p.allocations) p.allocations = []
         p.allocations.forEach(a => {
             if (!a.roles) a.roles = []
             if (!a.startWeek) a.startWeek = '2025-W01'
         })
     })
     localProjects.value = clean
  }
}, { immediate: true })

const activeProjectForHierarchy = computed(() => {
    return localProjects.value.find(p => p.id === selectedHierarchyProjectId.value)
})

const filteredProjects = computed(() => {
    if (!localProjects.value) return []
    return localProjects.value.map(p => {
        const activeAllocations = p.allocations.filter(a => {
            return isAllocationActiveInWeek(a, selectedWeek.value)
        })
        return {
            ...p,
            allocations: activeAllocations
        }
    })
})

const availableCollaborators = computed(() => {
    return JSON.parse(JSON.stringify(collabResult.value?.collaborators || []))
})

const globalWeekMilestones = computed(() => {
    if (!localProjects.value) return []

    const [y, w] = selectedWeek.value.split('-W').map(Number)
    const startOfWeek = dayjs().year(y).isoWeek(w).startOf('isoWeek')
    const endOfWeek = dayjs().year(y).isoWeek(w).endOf('isoWeek')

    const groups = []

    localProjects.value.forEach(p => {
        if (p.milestones && p.milestones.length) {
            const milestonesInWeek = p.milestones.filter(m => {
                const mDate = dayjs(m.date)
                return mDate.isAfter(startOfWeek.subtract(1, 'day')) && mDate.isBefore(endOfWeek.add(1, 'day'))
            }).sort((a,b) => a.date.localeCompare(b.date))

            if (milestonesInWeek.length > 0) {
                 groups.push({
                     projectId: p.id,
                     projectName: p.name,
                     milestones: milestonesInWeek,
                     count: milestonesInWeek.length
                 })
            }
        }
    })

    return groups
})

const getProjectById = (id) => localProjects.value.find(p => p.id === id)

const getSkillMatch = (collab, project) => {
  const requiredSkills = project.requiredRoles?.flatMap(r => r.skills || []) || []
  if (!requiredSkills.length) return { score: 100, status: 'good' }
  const hasSkill = requiredSkills.some(req =>
    collab.skills?.some(s => s.skill.name === req.name && s.level >= req.level)
  )
  return hasSkill ? { score: 100, status: 'good' } : { score: 0, status: 'bad' }
}

const getGlobalOccupation = (collaboratorId) => {
    if (!collaboratorId || !availableCollaborators.value) return 0
    const collab = availableCollaborators.value.find(c => c.id === collaboratorId)
    if (!collab || !collab.allocations) return 0

    return collab.allocations.reduce((acc, alloc) => {
         const isActive = isAllocationActiveInWeek(alloc, selectedWeek.value)
         return isActive ? acc + (alloc.dedicationPercentage || 0) : acc
    }, 0)
}

const openHierarchy = (project) => {
    selectedHierarchyProjectId.value = project.id
    hierarchyModalOpen.value = true
}


const handleDrop = (evt, projectId) => {
  if (evt.added) {
    const collaborator = evt.added.element

    const sourceProject = localProjects.value.find(p => p.id === projectId)
    const existingActiveAllocation = sourceProject?.allocations?.find(a => {
        const isActive = isAllocationActiveInWeek(a, selectedWeek.value)
        if (!isActive) return false
        return a.collaborator?.id === collaborator.id
    })

    if (existingActiveAllocation) {
        notificationStore.showToast("Este colaborador ya está asignado a este proyecto en esta semana.", 'error')
        return
    }

    assignmentContext.value = { projectId, collaborator }
    assignmentModalOpen.value = true
  }
}

const handleConfirmAssignment = async (data) => {
    await performAssignment(data, selectedWeek.value)
    assignmentModalOpen.value = false
}

const handleDeleteAllocation = async (allocation) => {
    await deleteAlloc(allocation, selectedWeek.value, getPrevWeek)
}

const handleUpdateAllocationPercentage = async (allocation, newPercentage) => {
    await performUpdatePercentage(allocation, newPercentage, selectedWeek.value, localProjects.value)
}

const handleAddRole = (allocation, roleId) => addRole(allocation, roleId)
const handleRemoveRole = (allocation, roleId) => removeRole(allocation, roleId)

</script>

<template>
  <div class="h-full flex flex-col relative bg-gray-50">

    <AllocationHeader
        v-model:viewMode="viewMode"
        v-model:zoomLevel="zoomLevel"
        v-model:selectedWeek="selectedWeek"
        v-model:monthlyRange="monthlyRange"
        @navigate="gotToWeek"
        @open-manager="managerOpen = true"
    >
        <template #summary>
            <GlobalMilestonesSummary v-if="viewMode === 'weekly'" :milestones="globalWeekMilestones" />
        </template>
    </AllocationHeader>

    <div v-if="managerOpen" class="z-[60] relative">
        <MilestoneManager @close="managerOpen = false" />
    </div>

    <div v-if="hierarchyModalOpen && activeProjectForHierarchy" class="z-[60] relative">
        <HierarchyManager :project="activeProjectForHierarchy" :isOpen="hierarchyModalOpen" @close="hierarchyModalOpen = false" />
    </div>

    <AssignmentModal
        v-if="assignmentModalOpen"
        :show="assignmentModalOpen"
        :project="getProjectById(assignmentContext.projectId)"
        :collaborator="assignmentContext.collaborator"
        :week="selectedWeek"
        @close="assignmentModalOpen = false"
        @confirm="handleConfirmAssignment"
    />

    <div v-if="viewMode === 'weekly'" class="bg-white">
        <CollaboratorPool
            v-model:availableOnly="availableOnly"
            :collaborators="availableCollaborators"
            :loading="collabsLoading"
            :selectedWeek="selectedWeek"
            @drag-start="dragging = true"
            @drag-end="dragging = false"
        />
    </div>

    <div class="flex-1 overflow-auto p-6">
      <div v-if="projectsLoading">Cargando proyectos...</div>

      <div v-else-if="viewMode === 'weekly'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <ProjectAllocationCard
            v-for="project in filteredProjects"
            :key="project.id"
            :project="project"
            :currentWeek="selectedWeek"
            :dragging="dragging"
            :getSkillMatch="getSkillMatch"
            :getGlobalOccupation="getGlobalOccupation"
            :absences="absences"
            @drop="handleDrop($event, project.id)"
            @delete-allocation="handleDeleteAllocation"
            @update-allocation-percentage="handleUpdateAllocationPercentage"
            @add-role="handleAddRole"
            @remove-role="handleRemoveRole"
            @open-hierarchy="openHierarchy(project)"
        />

      </div>
      <div v-else class="flex flex-col gap-6">

          <GanttTimelineView
            v-for="project in localProjects"
            :key="project.id"
            :project="project"
            :absences="absences"
            :chart-start="monthlyRange.start"
            :chart-end="monthlyRange.end"
          />
      </div>


    </div>
  </div>
</template>
