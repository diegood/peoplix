<script setup>
import { computed, ref, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
    GET_PROJECTS, 
    GET_COLLABORATORS, 
    CREATE_ALLOCATION, 
    UPDATE_ALLOCATION, 
    DELETE_ALLOCATION, 
    ADD_ALLOCATION_ROLE, 
    REMOVE_ALLOCATION_ROLE 
} from '@/modules/Allocations/graphql/allocation.queries'
import { dayjs } from '@/config'
import { useNotificationStore } from '@/stores/notificationStore'

// Components
import AllocationHeader from '../components/AllocationHeader.vue'
import GlobalMilestonesSummary from '../components/GlobalMilestonesSummary.vue'
import CollaboratorPool from '../components/CollaboratorPool.vue'
import ProjectAllocationCard from '../components/ProjectAllocationCard.vue'
import MonthlyTimelineView from '../components/MonthlyTimelineView.vue'
import AssignmentModal from '../forms/AssignmentModal.vue'

// Legacy Shared Components (outside module for now)
import MilestoneManager from '@/components/MilestoneManager.vue'
import HierarchyManager from '@/components/HierarchyManager.vue'

const notificationStore = useNotificationStore()

// --- State ---
const hierarchyModalOpen = ref(false)
const managerOpen = ref(false)
const selectedHierarchyProjectId = ref(null)

const dragging = ref(false)
const localProjects = ref([])
const viewMode = ref('weekly')
const zoomLevel = ref('month')
const monthlyRange = ref({
    start: dayjs().format('YYYY-MM'),
    end: dayjs().add(2, 'month').format('YYYY-MM')
})

// --- Date Utils ---
const getISOWeek = (d = new Date()) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}
const selectedWeek = ref(getISOWeek())

// --- Assignment Modal State ---
const assignmentModalOpen = ref(false)
const assignmentContext = ref({
    projectId: null,
    collaborator: null
})

// --- Queries & Mutations ---
const { result: projectResult, loading: projectsLoading } = useQuery(GET_PROJECTS)
const { result: collabResult, loading: collabsLoading } = useQuery(GET_COLLABORATORS)

const { mutate: createAllocation } = useMutation(CREATE_ALLOCATION, { refetchQueries: ['GetProjects', 'GetCollaborators'] })
const { mutate: updateAllocation } = useMutation(UPDATE_ALLOCATION, { refetchQueries: ['GetProjects'] })
const { mutate: deleteAllocation } = useMutation(DELETE_ALLOCATION, { refetchQueries: ['GetProjects'] })
const { mutate: addAllocationRole } = useMutation(ADD_ALLOCATION_ROLE, { refetchQueries: ['GetProjects'] })
const { mutate: removeAllocationRole } = useMutation(REMOVE_ALLOCATION_ROLE, { refetchQueries: ['GetProjects'] })


// --- Sync Projects ---
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

// --- Computed Data ---
const activeProjectForHierarchy = computed(() => {
    return localProjects.value.find(p => p.id === selectedHierarchyProjectId.value)
})

const filteredProjects = computed(() => {
    if (!localProjects.value) return []
    return localProjects.value.map(p => {
        const activeAllocations = p.allocations.filter(a => {
            return a.startWeek <= selectedWeek.value && (!a.endWeek || a.endWeek >= selectedWeek.value)
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

const monthlyTimeline = computed(() => {
    const start = dayjs(monthlyRange.value.start).startOf('month')
    const end = dayjs(monthlyRange.value.end).endOf('month')
    
    const items = []
    
    if (zoomLevel.value === 'month') {
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'month')) {
            items.push({
                label: current.format('MMM'),
                sublabel: current.format('YYYY'),
                date: current.toDate(),
                key: current.format('YYYY-MM'),
                isWeekend: false
            })
            current = current.add(1, 'month')
        }
    } else {
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'day')) {
            const dayOfWeek = current.day()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                items.push({
                    label: current.date(),
                    sublabel: current.format('dd'),
                    date: current.toDate(),
                    key: current.format('YYYY-MM-DD'),
                    isWeekend: false 
                })
            }
            current = current.add(1, 'day')
        }
    }
    return items
})

// --- Logic Helpers ---
const getProjectById = (id) => localProjects.value.find(p => p.id === id)

const getSkillMatch = (collab, project) => {
  const requiredSkills = project.requiredRoles?.flatMap(r => r.skills || []) || []
  if (!requiredSkills.length) return { score: 100, status: 'good' }
  const hasSkill = requiredSkills.some(req => 
    collab.skills?.some(s => s.skill.name === req.name && s.level >= req.level)
  )
  return hasSkill ? { score: 100, status: 'good' } : { score: 0, status: 'bad' }
}

const gotToWeek = (direction) => {
    const operation = direction === 'prev' ? 'subtract' : 'add'
    const [y, w] = selectedWeek.value.split('-W').map(Number)
    const d = dayjs().year(y).isoWeek(w).startOf('isoWeek')[operation](1, 'week')
    selectedWeek.value = `${d.year()}-W${d.isoWeek().toString().padStart(2, '0')}`
}

const openHierarchy = (project) => {
    selectedHierarchyProjectId.value = project.id
    hierarchyModalOpen.value = true
}

// --- Action Handlers ---

const handleDrop = (evt, projectId) => {
  if (evt.added) {
    const collaborator = evt.added.element
    
    const sourceProject = localProjects.value.find(p => p.id === projectId)
    const existingActiveAllocation = sourceProject?.allocations?.find(a => {
        const isActive = a.startWeek <= selectedWeek.value && (!a.endWeek || a.endWeek >= selectedWeek.value)
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
    await createAllocation({
        projectId: data.projectId,
        collaboratorId: data.collaboratorId,
        roleId: data.roleId,
        percentage: Number(data.percentage),
        startWeek: selectedWeek.value
    })
    assignmentModalOpen.value = false
}

const handleDeleteAllocation = async (allocationId) => {
    if (await notificationStore.showDialog("¿Eliminar registro completo? (Para finalizar asignación, edita el porcentaje)")) {
        await deleteAllocation({ allocationId })
    }
}

const handleUpdateAllocationPercentage = async (allocation, newPercentage) => {
    const newPerc = Number(newPercentage)
    if (allocation.dedicationPercentage === newPerc) return

    if (allocation.startWeek === selectedWeek.value) {
        await updateAllocation({ allocationId: allocation.id, percentage: newPerc })
    } else {
        if (await notificationStore.showDialog("Cambiar dedicación implica crear un nuevo registro desde esta semana. ¿Continuar?")) {
            let w = parseInt(selectedWeek.value.split('-W')[1])
            let y = parseInt(selectedWeek.value.split('-W')[0])
            let prevWeek = ''
            if (w > 1) {
                prevWeek = `${y}-W${(w-1).toString().padStart(2,'0')}`
            } else {
                prevWeek = `${y-1}-W52`
            }
            
            await updateAllocation({ allocationId: allocation.id, percentage: Number(allocation.dedicationPercentage) || 0, endWeek: prevWeek })
            
            const primaryRole = allocation.roles[0]
            if (primaryRole) {
                // Find project ID since allocation object might not have it directly depending on nesting
                const projectId = allocation.project?.id || localProjects.value.find(p=>p.allocations.find(a=>a.id===allocation.id)).id
                const res = await createAllocation({
                    projectId,
                    collaboratorId: allocation.collaborator.id,
                    roleId: primaryRole.id,
                    percentage: newPerc,
                    startWeek: selectedWeek.value
                })
                
                const newId = res.data.createAllocation.id
                for (let i = 1; i < allocation.roles.length; i++) {
                    await addAllocationRole({ allocationId: newId, roleId: allocation.roles[i].id })
                }
            }
        }
    }
}

const handleAddRole = async (allocation, roleId) => {
    if (!roleId) return
    await addAllocationRole({ allocationId: allocation.id, roleId })
}

const handleRemoveRole = async (allocation, roleId) => {
     if (await notificationStore.showDialog("¿Desasignar este rol?")) {
         await removeAllocationRole({ allocationId: allocation.id, roleId })
     }
}

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
    
    <!-- Modals -->
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

    <!-- Weekly Component: Collaborator Pool -->
    <CollaboratorPool 
        v-if="viewMode === 'weekly'" 
        :collaborators="availableCollaborators" 
        :loading="collabsLoading"
        :selectedWeek="selectedWeek"
        @drag-start="dragging = true"
        @drag-end="dragging = false"
    />

    <div class="flex-1 overflow-auto p-6">
      <div v-if="projectsLoading">Cargando proyectos...</div>
      
      <!-- Weekly View -->
      <div v-else-if="viewMode === 'weekly'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <ProjectAllocationCard 
            v-for="project in filteredProjects" 
            :key="project.id" 
            :project="project"
            :currentWeek="selectedWeek"
            :dragging="dragging"
            :getSkillMatch="getSkillMatch"
            @drop="handleDrop"
            @delete-allocation="handleDeleteAllocation"
            @update-allocation-percentage="handleUpdateAllocationPercentage"
            @add-role="handleAddRole"
            @remove-role="handleRemoveRole"
            @open-hierarchy="openHierarchy"
        />
        
      </div>
      
      <!-- Monthly View -->
      <MonthlyTimelineView 
        v-else 
        :projects="localProjects"
        :timelineItems="monthlyTimeline"
        :zoomLevel="zoomLevel"
        @open-hierarchy="openHierarchy"
      />

    </div>
  </div>
</template>
