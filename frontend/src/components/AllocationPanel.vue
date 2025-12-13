<script setup>
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PROJECTS, GET_COLLABORATORS, CREATE_ALLOCATION, UPDATE_ALLOCATION, DELETE_ALLOCATION, ADD_ALLOCATION_ROLE, REMOVE_ALLOCATION_ROLE } from '@/graphql/queries'
import { GripVertical, AlertCircle, CheckCircle, Trash2, X, Plus, Calendar, ChevronLeft, ChevronRight, Settings2 } from 'lucide-vue-next'
import { dayjs } from '@/config'
import ProjectMilestones from './ProjectMilestones.vue'
import MilestoneManager from './MilestoneManager.vue'
import HierarchyManager from './HierarchyManager.vue'
import { Network } from 'lucide-vue-next'

const hierarchyModalOpen = ref(false)
const managerOpen = ref(false)
const selectedHierarchyProjectId = ref(null)

const activeProjectForHierarchy = computed(() => {
    return localProjects.value.find(p => p.id === selectedHierarchyProjectId.value)
})

const openHierarchy = (project) => {
    selectedHierarchyProjectId.value = project.id
    hierarchyModalOpen.value = true
}

// ... existing code ...


// ... template ...
const { result: projectResult, loading: projectsLoading } = useQuery(GET_PROJECTS)
const { result: collabResult, loading: collabsLoading } = useQuery(GET_COLLABORATORS)

// Mutations
const { mutate: createAllocation } = useMutation(CREATE_ALLOCATION, { refetchQueries: ['GetProjects', 'GetCollaborators'] })
const { mutate: updateAllocation } = useMutation(UPDATE_ALLOCATION, { refetchQueries: ['GetProjects'] })
const { mutate: deleteAllocation } = useMutation(DELETE_ALLOCATION, { refetchQueries: ['GetProjects'] })
const { mutate: addAllocationRole } = useMutation(ADD_ALLOCATION_ROLE, { refetchQueries: ['GetProjects'] })
const { mutate: removeAllocationRole } = useMutation(REMOVE_ALLOCATION_ROLE, { refetchQueries: ['GetProjects'] })

// Local state
const dragging = ref(false)
const localProjects = ref([])
const viewMode = ref('weekly') // 'weekly' or 'monthly'
const zoomLevel = ref('month') // 'month' or 'day'
const monthlyRange = ref({
    start: dayjs().format('YYYY-MM'),
    end: dayjs().add(2, 'month').format('YYYY-MM')
})

// Week Selector
const getISOWeek = (d = new Date()) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}
const selectedWeek = ref(getISOWeek())

// Assignment Modal State
const assignmentModalOpen = ref(false)
const assignmentForm = ref({
    projectId: null,
    collaborator: null,
    roleId: '',
    percentage: 50
})

// Add Role Popover Helper
const addingRoleToAllocId = ref(null)

// Deep watch & clone to ensure mutability
watch(projectResult, (newVal) => {
  if (newVal?.projects) {
     const clean = JSON.parse(JSON.stringify(newVal.projects))
     // Ensure roles array exists (mock fix)
     clean.forEach(p => {
         if (!p.allocations) p.allocations = []
         p.allocations.forEach(a => {
             if (!a.roles) a.roles = []
             // Normalize weeks if missing (mock data fix)
             if (!a.startWeek) a.startWeek = '2025-W01'
         })
     })
     localProjects.value = clean
  }
}, { immediate: true })

// FILTER PROJECTS BY SELECTED WEEK
// We only show allocations active in selectedWeek
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

// Helper to check skill match (mock logic)
const getSkillMatch = (collab, project) => {
  const requiredSkills = project.requiredRoles?.flatMap(r => r.skills || []) || []
  if (!requiredSkills.length) return { score: 100, status: 'good' }
  const hasSkill = requiredSkills.some(req => 
    collab.skills?.some(s => s.name === req.name && s.level >= req.level)
  )
  return hasSkill ? { score: 100, status: 'good' } : { score: 0, status: 'bad' }
}

// Drops
const onDrop = (evt, projectId) => {
  if (evt.added) {
    const collaborator = evt.added.element
    const project = filteredProjects.value.find(p => p.id === projectId)
    
    // Check for Duplicates in current week
    const sourceProject = localProjects.value.find(p => p.id === projectId)
    const existingActiveAllocation = sourceProject?.allocations?.find(a => {
        const isActive = a.startWeek <= selectedWeek.value && (!a.endWeek || a.endWeek >= selectedWeek.value)
        if (!isActive) return false
        return a.collaborator?.id === collaborator.id
    })
    
    if (existingActiveAllocation) {
        alert("Este colaborador ya está asignado a este proyecto en esta semana.")
        return
    }

    // Open Modal
    assignmentForm.value = {
        projectId,
        collaborator,
        roleId: '', // User must select
        percentage: 50
    }
    
    // Auto-select role if only one exists
    if (project?.requiredRoles?.length === 1) {
        assignmentForm.value.roleId = project.requiredRoles[0].role.id
    }
    
    assignmentModalOpen.value = true
  }
}

const confirmAssignment = async () => {
    if (!assignmentForm.value.roleId) {
        alert("Debes seleccionar un Rol")
        return
    }
    
    await createAllocation({
        projectId: assignmentForm.value.projectId,
        collaboratorId: assignmentForm.value.collaborator.id,
        roleId: assignmentForm.value.roleId,
        percentage: Number(assignmentForm.value.percentage),
        startWeek: selectedWeek.value
    })
    
    assignmentModalOpen.value = false
}

const handleDedicationChange = async (allocation, newPercentage) => {
    const newPerc = Number(newPercentage)
    if (allocation.dedicationPercentage === newPerc) return

    if (allocation.startWeek === selectedWeek.value) {
        // Direct update
        await updateAllocation({ allocationId: allocation.id, percentage: newPerc })
    } else {
        // Split!
        if (confirm("Cambiar dedicación implica crear un nuevo registro desde esta semana. ¿Continuar?")) {
            let w = parseInt(selectedWeek.value.split('-W')[1])
            let y = parseInt(selectedWeek.value.split('-W')[0])
            let prevWeek = ''
            if (w > 1) {
                prevWeek = `${y}-W${(w-1).toString().padStart(2,'0')}`
            } else {
                prevWeek = `${y-1}-W52` // approx
            }
            
            await updateAllocation({ allocationId: allocation.id, percentage: Number(allocation.dedicationPercentage) || 0, endWeek: prevWeek })
            
            // 2. Create new one
            const primaryRole = allocation.roles[0]
            if (primaryRole) {
                const res = await createAllocation({
                    projectId: allocation.project?.id || localProjects.value.find(p=>p.allocations.find(a=>a.id===allocation.id)).id,
                    collaboratorId: allocation.collaborator.id,
                    roleId: primaryRole.id,
                    percentage: newPerc,
                    startWeek: selectedWeek.value
                })
                
                // Add rest of roles
                const newId = res.data.createAllocation.id
                for (let i = 1; i < allocation.roles.length; i++) {
                    await addAllocationRole({ allocationId: newId, roleId: allocation.roles[i].id })
                }
            }
        }
    }
}

const handleAddRoleAction = async (allocation, roleId) => {
    if (!roleId) return
    await addAllocationRole({ allocationId: allocation.id, roleId })
    addingRoleToAllocId.value = null
}

const handleRemoveRole = async (allocation, roleId) => {
     if (confirm("¿Desasignar este rol?")) {
         await removeAllocationRole({ allocationId: allocation.id, roleId })
     }
}

const handleDelete = async (allocationId) => {
    if (confirm("¿Eliminar registro completo? (Para finalizar asignación, edita el porcentaje)")) {
        await deleteAllocation({ allocationId })
    }
}

const availableCollaborators = computed(() => {
    const collabs = JSON.parse(JSON.stringify(collabResult.value?.collaborators || []))
    // Could compute remaining availability here based on filteredProjects
    return collabs
})

// Helper to get roles for a project
const getProjectRoles = (projectId) => {
    const project = localProjects.value.find(p => p.id === projectId)
    return project?.requiredRoles?.map(r => r.role) || []
}

// Available roles to add
const getAvailableRolesToAdd = (projectId, currentRoles) => {
    const all = getProjectRoles(projectId)
    const currentIds = currentRoles.map(r => r.id)
    return all.filter(r => !currentIds.includes(r.id))
}

const gotToWeek = (direction) => {
    const operation = direction === 'prev' ? 'subtract' : 'add'
    const [y, w] = selectedWeek.value.split('-W').map(Number)
    const d = dayjs().year(y).isoWeek(w).startOf('isoWeek')[operation](1, 'week')
    selectedWeek.value = `${d.year()}-W${d.isoWeek().toString().padStart(2, '0')}`
}

const globalWeekMilestones = computed(() => {
    if (!localProjects.value) return []
    
    // Calculate start and end of selected week
    const [y, w] = selectedWeek.value.split('-W').map(Number)
    const startOfWeek = dayjs().year(y).isoWeek(w).startOf('isoWeek')
    const endOfWeek = dayjs().year(y).isoWeek(w).endOf('isoWeek')
    
    // Group by project
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

const getTypeColor = (milestoneOrType) => {
    // If it's a full milestone object with nested type
    if (typeof milestoneOrType === 'object' && milestoneOrType.milestoneType) {
        return milestoneOrType.milestoneType.color
    }
    // Fallback for legacy string types (just in case)
    if (typeof milestoneOrType === 'string') {
        // Try to find in loaded types? For now keep legacy static map or default
        switch (milestoneOrType) {
            case 'Delivery': return 'bg-red-400'
            case 'Meeting': return 'bg-blue-400'
            case 'DevOps': return 'bg-green-400'
             default: return 'bg-purple-400'
        }
    }
    return milestoneOrType?.color || 'bg-gray-400'
}

const availableMilestoneTypes = computed(() => {
    if (!localProjects.value) return []
    const typesMap = new Map()
    localProjects.value.forEach(p => {
        if (p.milestones) {
            p.milestones.forEach(m => {
                if (m.milestoneType) {
                    typesMap.set(m.milestoneType.name, m.milestoneType)
                } else if (m.type) {
                     // Legacy support
                     typesMap.set(m.type, { name: m.type, color: getTypeColor(m.type) })
                }
            })
        }
    })
    return Array.from(typesMap.values()).sort((a,b) => a.name.localeCompare(b.name))
})

// MONTHLY VIEW LOGIC
const monthlyTimeline = computed(() => {
    const start = dayjs(monthlyRange.value.start).startOf('month')
    const end = dayjs(monthlyRange.value.end).endOf('month')
    
    const items = []
    
    if (zoomLevel.value === 'month') {
        // Generate array of months
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'month')) {
            items.push({
                label: current.format('MMM'), // 'Ene'
                sublabel: current.format('YYYY'),
                date: current.toDate(),
                key: current.format('YYYY-MM'),
                isWeekend: false
            })
            current = current.add(1, 'month')
        }
    } else {
        // Generate array of days, SKIPPING weekends
        let current = start
        while (current.isBefore(end) || current.isSame(end, 'day')) {
            const dayOfWeek = current.day()
            // 0 = Sunday, 6 = Saturday
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                items.push({
                    label: current.date(),
                    sublabel: current.format('dd'),
                    date: current.toDate(),
                    key: current.format('YYYY-MM-DD'),
                    isWeekend: false // Always false now
                })
            }
            current = current.add(1, 'day')
        }
    }
    return items
})

const getMilestonesForKey = (project, key) => {
    if (!project.milestones || !project.milestones.length) return []
    
    return project.milestones.filter(m => {
        if (zoomLevel.value === 'month') {
             // Month key is YYYY-MM
             return dayjs(m.date).format('YYYY-MM') === key
        } else {
             // Day key is YYYY-MM-DD
             let mKey = dayjs(m.date).format('YYYY-MM-DD')
             // Handle weekend milestones snapping to Friday if needed, 
             // but for now, since we filter weekends visually, we might miss them.
             // Best approach: If strict day view, show exact matches. 
             // Weekend milestones simply won't appear if the column isn't there.
             return mKey === key
        }
    })
}

const isToday = (dateObj) => {
    return dayjs(dateObj).isSame(dayjs(), 'day')
}

</script>

<template>
  <div class="h-full flex flex-col relative bg-gray-50">
    
    <!-- Week Selector Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
                 <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar class="text-blue-600" />
                    Planificación
                </h2>
                <!-- View Toggler -->
                <div class="flex bg-gray-100 p-1 rounded-lg">
                    <button @click="viewMode = 'weekly'" 
                            class="px-3 py-1 text-sm rounded-md transition-all"
                            :class="viewMode === 'weekly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Semanal
                    </button>
                    <button @click="viewMode = 'monthly'" 
                            class="px-3 py-1 text-sm rounded-md transition-all"
                            :class="viewMode === 'monthly' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Mensual
                    </button>
                </div>
            </div>

            <!-- Global Milestones Summary (Weekly Mode) -->
            <div v-if="viewMode === 'weekly'">
                <div v-if="globalWeekMilestones.length > 0" class="flex items-center gap-2 mt-1 text-xs text-gray-500 overflow-x-auto max-w-lg">
                    <span class="font-semibold text-gray-700">Hitos de la semana:</span>
                    <div v-for="g in globalWeekMilestones" :key="g.projectId" class="flex items-center gap-2 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <!-- Dots for each milestone in the group -->
                        <div class="flex -space-x-1">
                             <div v-for="m in g.milestones" :key="m.id" 
                                  class="w-2.5 h-2.5 rounded-full border border-white" 
                                  :class="getTypeColor(m.type)" 
                                  :title="m.name + ' (' + m.date + ')'">
                             </div>
                        </div>
                        <span class="text-gray-700 font-medium">
                            <span v-if="g.count > 1" class="font-bold">({{ g.count }})</span>
                            {{ g.projectName }}
                        </span>
                    </div>
                </div>
                <div v-else class="text-xs text-gray-400 mt-1 italic">Sin hitos esta semana</div>
            </div>
             <!-- Monthly Mode Summary/Legend -->
            <div v-if="viewMode === 'monthly'" class="text-xs text-gray-500 mt-1 flex items-center gap-3">
                 <span v-for="typeObj in availableMilestoneTypes" :key="typeObj.name" class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full" :class="getTypeColor(typeObj)"></div> 
                    {{ typeObj.name }}
                 </span>
                 
                 <div class="h-4 w-px bg-gray-300 mx-2"></div>
                 
                 <!-- Zoom Controls -->
                 <div class="flex bg-gray-100 p-0.5 rounded-lg">
                    <button @click="zoomLevel = 'month'" 
                            class="px-2 py-0.5 text-xs rounded transition-all"
                            :class="zoomLevel === 'month' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Mes
                    </button>
                    <button @click="zoomLevel = 'day'" 
                            class="px-2 py-0.5 text-xs rounded transition-all"
                            :class="zoomLevel === 'day' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'">
                        Día
                    </button>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <!-- Weekly Controls -->
            <template v-if="viewMode === 'weekly'">
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center" @click="gotToWeek('prev')">
                    <ChevronLeft size="16" />
                </button>
                 <input type="week" v-model="selectedWeek" class="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center" @click="gotToWeek('next')">
                    <ChevronRight size="16" />
                </button>
            </template>
            <!-- Monthly Controls -->
             <template v-else>
                 <div class="flex items-center gap-2 text-sm">
                     <span class="text-gray-500">Desde:</span>
                     <input type="month" v-model="monthlyRange.start" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500" />
                     <span class="text-gray-500">Hasta:</span>
                     <input type="month" v-model="monthlyRange.end" class="border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-blue-500" />
                     
                     <div class="h-6 w-px bg-gray-300 mx-2"></div>
                     
                     <button @click="managerOpen = true" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition">
                        <Settings2 size="14" />
                        Gestionar Hitos
                     </button>
                 </div>
            </template>
        </div>
    </div>
    
    <!-- Modals -->
    <div v-if="managerOpen" class="z-[60] relative">
        <MilestoneManager @close="managerOpen = false" />
    </div>

    <div v-if="hierarchyModalOpen && activeProjectForHierarchy" class="z-[60] relative">
        <HierarchyManager :project="activeProjectForHierarchy" :isOpen="hierarchyModalOpen" @close="hierarchyModalOpen = false" />
    </div>
    
    <!-- Modal for New Assignment (ONLY WEEKLY) -->
    <div v-if="assignmentModalOpen && viewMode === 'weekly'" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white p-6 rounded-xl shadow-xl w-96">
            <h3 class="font-bold text-lg mb-4 text-gray-800">Asignar Colaborador</h3>
             <div class="bg-blue-50 text-blue-700 px-3 py-2 rounded mb-4 text-sm flex items-center gap-2">
                <Calendar size="16"/> Semana {{ selectedWeek }}
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-500 mb-1">Colaborador</p>
                <div class="font-medium bg-gray-50 p-2 rounded border border-gray-200">
                    {{ assignmentForm.collaborator?.name }}
                </div>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm text-gray-500 mb-1 font-bold">Rol Principal</label>
                <select v-model="assignmentForm.roleId" class="w-full border rounded px-3 py-2">
                    <option value="" disabled>Seleccionar Rol...</option>
                    <option v-for="role in getProjectRoles(assignmentForm.projectId)" :key="role.id" :value="role.id">
                        {{ role.name }}
                    </option>
                </select>
                <p v-if="getProjectRoles(assignmentForm.projectId).length === 0" class="text-xs text-red-400 mt-1">
                    Este proyecto no tiene roles requeridos definidos.
                </p>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm text-gray-500 mb-1 font-bold">Dedicación (%)</label>
                <input v-model="assignmentForm.percentage" type="number" min="1" max="100" class="w-full border rounded px-3 py-2" />
            </div>
            
            <div class="flex justify-end gap-2">
                <button @click="assignmentModalOpen = false" class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancelar</button>
                <button @click="confirmAssignment" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50" :disabled="!assignmentForm.roleId">
                    Confirmar
                </button>
            </div>
        </div>
    </div>

    <!-- Top: Unallocated / Source Pool (ONLY WEEKLY) -->
    <div v-if="viewMode === 'weekly'" class="bg-white p-4 border-b border-gray-200 shadow-sm relative z-10">
      <h3 class="font-bold text-gray-700 mb-2">Colaboradores (Arrastrar para asignar en {{selectedWeek}})</h3>
      <div v-if="collabsLoading">Cargando...</div>
      <draggable 
        v-else
        :list="availableCollaborators" 
        :group="{ name: 'people', pull: 'clone', put: false }" 
        item-key="id"
        @start="dragging = true" 
        @end="dragging = false"
        class="flex gap-3 overflow-x-auto pb-2"
      >
        <template #item="{ element }">
          <div class="flex-shrink-0 w-48 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow select-none">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                 {{ element.name.charAt(0) }}
              </div>
              <div>
                <div class="font-semibold text-sm truncate">{{ element.name }}</div>
                <div class="text-xs text-gray-400">{{ element.contractedHours }} hrs</div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 overflow-auto p-6">
      <div v-if="projectsLoading">Cargando proyectos...</div>
      
      <!-- WEEKLY VIEW: GRID -->
      <div v-else-if="viewMode === 'weekly'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <div v-for="project in filteredProjects" :key="project.id" 
             class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[300px]">
          <!-- Project Header -->
          <div class="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
             <div class="flex justify-between items-start mb-2">
               <div class="flex items-center gap-2">
                   <h3 class="font-bold text-lg text-gray-800">{{ project.name }}</h3>
                   <button @click="openHierarchy(project)" class="p-1 px-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Jerarquía">
                       <Network size="16"/>
                   </button>
               </div>
               <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{{ project.contractedHours }} h</span>
             </div>
              <div class="flex flex-wrap gap-1">
               <template v-for="req in project.requiredRoles" :key="req.id">
                   <span v-for="skill in req.skills" :key="skill.id" class="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded" :title="req.role.name">
                     {{ skill.name }}
                   </span>
               </template>
              </div>
          </div>
          
          <!-- Milestones / Timeline -->
          <ProjectMilestones :project="project" :currentWeek="selectedWeek" />

          <!-- Component Drop Zone -->
          <div class="flex-1 p-3 bg-gray-50/30">
            <draggable 
              :list="project.allocations || []" 
              group="people" 
              item-key="id"
              class="h-full min-h-[100px] space-y-2 rounded-lg border-2 border-dashed border-transparent transition-colors"
              :class="{ 'border-blue-200 bg-blue-50/50': dragging }"
              @change="(evt) => onDrop(evt, project.id)"
            >
               <template #item="{ element }">
                 <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2 group relative">
                    
                    <!-- Top Row: Grip + Avatar + Name -->
                    <div class="flex items-center gap-3">
                      <GripVertical class="text-gray-300 cursor-grab active:cursor-grabbing" size="14" />
                       <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                         {{ (element.collaborator?.name || element.name || '?').charAt(0) }}
                       </div>
                       <div class="flex-1">
                         <div class="font-medium text-sm">{{ element.collaborator?.name || element.name }}</div>
                       </div>
                       
                       <!-- Actions -->
                       <div class="flex items-center gap-2">
                           <!-- Skill Match Indicator -->
                           <div v-if="getSkillMatch(element.collaborator || element, project).status === 'good'" class="text-green-500" title="Skills Match">
                               <CheckCircle size="14" />
                           </div>
                           <div v-else class="text-amber-400" title="Low Skill Match">
                               <AlertCircle size="14" />
                           </div>
                           
                           <!-- Delete -->
                           <button @click="handleDelete(element.id)" class="text-gray-300 hover:text-red-500 transition-colors">
                               <Trash2 size="14" />
                           </button>
                       </div>
                    </div>

                    <!-- Bottom Row: Roles Tokens + Add Btn + Percentage -->
                    <div class="flex items-start justify-between border-t border-gray-50 pt-2 gap-2">
                        <!-- Roles List -->
                        <div class="flex-1 flex flex-wrap gap-1">
                             <div v-for="role in element.roles" :key="role.id" 
                                class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                {{ role.name }}
                                <button @click="handleRemoveRole(element, role.id)" class="hover:text-red-500"><X size="10"/></button>
                             </div>
                             
                             <!-- Add Role Button/Dropdown -->
                             <div class="relative">
                                 <button @click="addingRoleToAllocId = (addingRoleToAllocId === element.id ? null : element.id)" 
                                         class="text-blue-500 hover:bg-blue-50 p-0.5 rounded">
                                     <Plus size="14" />
                                 </button>
                                 <!-- Simple Popover for Role Selection -->
                                 <div v-if="addingRoleToAllocId === element.id" class="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-1 z-20 w-32">
                                     <div v-for="r in getAvailableRolesToAdd(project.id, element.roles)" :key="r.id" 
                                          @click="handleAddRoleAction(element, r.id)"
                                          class="text-xs p-1 hover:bg-gray-100 cursor-pointer rounded">
                                         {{ r.name }}
                                     </div>
                                     <div v-if="getAvailableRolesToAdd(project.id, element.roles).length === 0" class="text-[10px] text-gray-400 p-1">
                                         Sin roles disponibles
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <!-- Percentage Input -->
                        <div class="text-xs text-green-600 font-medium flex items-center gap-1 shrink-0">
                           <input type="number" 
                                  :value="element.dedicationPercentage || 50" 
                                  @change="(e) => handleDedicationChange(element, e.target.value)"
                                  class="w-10 border rounded px-1 py-0.5 text-xs text-center focus:ring-1 focus:ring-green-500 outline-none"
                                  min="0" max="100" />
                           %
                        </div>
                    </div>
                    
                 </div>
               </template>
               <template #footer>
                 <div v-if="!project.allocations?.length" class="h-full flex items-center justify-center text-gray-400 text-sm italic py-8">
                   Arrastra colaboradores aquí
                 </div>
               </template>
            </draggable>
          </div>
        </div>
      </div>
      
      <!-- MONTHLY VIEW: GANTT / TIMELINE -->
      <div v-else class="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 min-h-0 overflow-auto relative">
             <!-- Timeline Header Row -->
             <div class="flex border-b border-gray-200 text-sm font-bold text-gray-700 bg-gray-50 sticky top-0 z-30 min-w-max">
                  <div class="w-64 p-4 border-r border-gray-200 shrink-0 uppercase tracking-wider text-xs sticky left-0 bg-gray-50 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Proyecto
                  </div>
                  <div class="flex">
                      <div v-for="item in monthlyTimeline" :key="item.key" 
                           class="shrink-0 border-r border-gray-200 text-center flex flex-col justify-center text-xs h-12 box-border"
                           :class="[
                               item.isWeekend ? 'bg-gray-100' : 'bg-gray-50',
                               zoomLevel === 'day' ? 'w-10' : 'min-w-[80px] w-auto'
                           ]">
                          <span class="uppercase tracking-wider">{{ item.label }}</span>
                          <span v-if="item.sublabel" class="text-[10px] text-gray-400 font-normal">{{ item.sublabel }}</span>
                      </div>
                  </div>
             </div>
             
             <!-- Body Rows -->
             <div class="flex flex-col min-w-max">
                  <div v-for="project in localProjects" :key="project.id" class="flex hover:bg-gray-50 h-16 relative group border-b border-gray-100">
                       <!-- Project Info (Sticky Left) -->
                       <div class="w-64 p-4 border-r border-gray-200 shrink-0 flex items-center justify-between font-medium text-gray-800 text-sm sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 transition-colors">
                           <span>{{ project.name }}</span>
                           <button @click="openHierarchy(project)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Jerarquía">
                               <Network size="16"/>
                           </button>
                       </div>
                       
                       <!-- Timeline Cells -->
                       <div class="flex">
                            <div v-for="item in monthlyTimeline" :key="item.key" 
                                 class="shrink-0 border-r border-gray-100 relative flex items-center justify-center transition-colors box-border"
                                 :class="[
                                     item.isWeekend ? 'bg-gray-100/50' : '',
                                     zoomLevel === 'day' ? 'w-10' : 'min-w-[80px] w-auto',
                                     isToday(item.date) ? 'bg-blue-50/50 border-b-2 border-b-blue-400' : ''
                                 ]">
                                 
                                 <!-- Milestones in this Cell -->
                                 <template v-for="m in getMilestonesForKey(project, item.key)" :key="m.id">
                                     <div class="w-4 h-4 rounded-full border-2 border-white shadow cursor-help transform hover:scale-125 z-20 relative"
                                          :class="getTypeColor(m)"
                                          :title="m.name + ' (' + m.date + ')'">
                                     </div>
                                 </template>
                            </div>
                       </div>
                  </div>
                  
                  <div v-if="localProjects.length === 0" class="p-8 text-center text-gray-400 sticky left-0">
                      No hay proyectos
                  </div>
             </div>
      </div>

    </div>
  </div>
</template>
