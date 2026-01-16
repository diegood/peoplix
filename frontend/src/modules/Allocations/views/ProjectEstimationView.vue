<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PROJECT_WORK_PACKAGES, GET_PROJECTS } from '@/modules/Projects/graphql/project.queries'
import { CREATE_WORK_PACKAGE, ESTIMATE_TASK } from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'
import dayjs from '@/config/dayjs'
import { parseDateSafe } from '@/helper/Date'

import EstimationHeader from '@/modules/Allocations/components/Estimation/EstimationHeader.vue'
import EstimationWorkPackage from '@/modules/Allocations/components/Estimation/EstimationWorkPackage.vue'
import EstimationGantt from '@/modules/Allocations/components/Estimation/EstimationGantt.vue'
import HierarchyManager from '@/components/HierarchyManager.vue'
import { LayoutDashboard, Network } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id
const notificationStore = useNotificationStore()

const { result: projectResult } = useQuery(GET_PROJECTS)
const { result: wpResult, refetch: refetchWP } = useQuery(GET_PROJECT_WORK_PACKAGES, { projectId })

const project = computed(() => {
    return projectResult.value?.projects?.find(p => p.id === projectId)
})

const workPackages = computed(() => wpResult.value?.projectWorkPackages || [])

const { mutate: createWorkPackage } = useMutation(CREATE_WORK_PACKAGE)
const { mutate: estimateTask } = useMutation(ESTIMATE_TASK)

const newWPName = ref('')

const handleCreateWP = async () => {
    if (!newWPName.value) return
    try {
        await createWorkPackage({ projectId, name: newWPName.value })
        newWPName.value = ''
        refetchWP()
        notificationStore.showToast('Funcionalidad creada', 'success')
    } catch (e) {
        notificationStore.showToast(e.message, 'error')
    }
}

const showHierarchy = ref(false)

const roleColumns = computed(() => {
    if (!project.value) return []
    return project.value.requiredRoles
        .map(rr => rr.role)
        .filter(r => !r.isAdministrative)
})

const projectAllocations = computed(() => {
    return project.value?.allocations || []
})

const projectCollaborators = computed(() => {
    if (!project.value?.allocations) return []
    const unique = new Map()
    project.value.allocations.forEach(a => {
        if (a.collaborator && !unique.has(a.collaborator.id)) {
            unique.set(a.collaborator.id, a.collaborator)
        }
    })
    return Array.from(unique.values())
})

const summary = computed(() => {
    let totalHours = 0
    workPackages.value.forEach(wp => {
        wp.tasks?.forEach(t => {
            t.estimations?.forEach(e => {
                totalHours += e.hours
            })
        })
    })
    return { totalHours }
})

const chartStart = computed(() => {
    let earliest = null
    workPackages.value.forEach(wp => {
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

const debounceMap = ref(new Map())

const handleUpdateTaskDate = async ({ taskId, roleId, hours, startDate, endDate }) => {
    if (debounceMap.value.has(taskId)) {
        clearTimeout(debounceMap.value.get(taskId))
    }
    const timeoutId = setTimeout(async () => {
        try {
            await estimateTask({ taskId, roleId, hours: parseFloat(hours), startDate, endDate })
            await refetchWP()
            notificationStore.showToast('Fecha actualizada', 'success')
        } catch (err) {
            notificationStore.showToast('Error al mover tarea', 'error')
            refetchWP()
            console.error(err)
        } finally {
            debounceMap.value.delete(taskId)
        }
    }, 1000)

    debounceMap.value.set(taskId, timeoutId)
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8" v-if="project">
      
      <div class="flex justify-between items-center mb-[-1rem]">
          <router-link to="/projects" class="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
             &larr; Volver a Proyectos
          </router-link>
          <div class="flex gap-2">
            <button @click="showHierarchy = true" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                 <Network class="w-4 h-4" />
                 Jerarquía
            </button>
            <router-link :to="`/projects/${projectId}/kanban`" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors">
                 <LayoutDashboard class="w-4 h-4" />
                 Tablero Kanban
            </router-link>
          </div>
      </div>

      <EstimationHeader 
        :projectName="project.name" 
        :totalHours="summary.totalHours" 
      />

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-700 mb-4">Crear Paquete de trabajo</h3>
          <div class="flex gap-4">
              <input v-model="newWPName" placeholder="Nombre de la funcionalidad..." 
                     class="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" @keyup.enter="handleCreateWP" />
              <button @click="handleCreateWP" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  Agregar
              </button>
          </div>
      </div>

      <div class="space-y-4">
          <EstimationWorkPackage 
            v-for="(wp, index) in workPackages" 
            :key="wp.id" 
            :wp="wp"
            :role-columns="roleColumns"
            :initially-expanded="index === workPackages.length - 1"
            :project-collaborators="projectCollaborators"
            :project-allocations="projectAllocations"
            @refetch="refetchWP"
          />
      </div>

      <EstimationGantt 
        :workPackages="workPackages"
        :project="project"
        :chartStart="chartStart"
        :chartEnd="chartEnd"
        @update-task-date="handleUpdateTaskDate"
      />

      <HierarchyManager 
        v-if="showHierarchy"
        :project="project"
        :isOpen="showHierarchy"
        @close="showHierarchy = false"
      />

  </div>
  <div v-else class="p-8 text-center text-gray-500">
      Cargando proyecto...
  </div>
</template>
