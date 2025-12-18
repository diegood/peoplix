<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PROJECT_WORK_PACKAGES, GET_PROJECTS } from '@/graphql/queries'
import { CREATE_WORK_PACKAGE, ESTIMATE_TASK } from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'
import dayjs from '@/config/dayjs'
import { parseDateSafe } from '@/helper/Date'

import EstimationHeader from '@/modules/Allocations/components/Estimation/EstimationHeader.vue'
import EstimationWorkPackage from '@/modules/Allocations/components/Estimation/EstimationWorkPackage.vue'
import EstimationGantt from '@/modules/Allocations/components/Estimation/EstimationGantt.vue'

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

const roleColumns = computed(() => {
    if (!project.value) return []
    return project.value.requiredRoles.map(rr => rr.role)
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

const handleUpdateTaskDate = async ({ taskId, roleId, hours, startDate, endDate }) => {
    console.log('[DEBUG View] handleUpdateTaskDate', { taskId, roleId, hours, startDate, endDate })
    try {
        await estimateTask({ taskId, roleId, hours: parseFloat(hours), startDate, endDate })
        await refetchWP()
        notificationStore.showToast('Fecha actualizada', 'success')
    } catch (err) {
        notificationStore.showToast('Error al mover tarea', 'error')
        refetchWP()
        console.error(err)
    }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8" v-if="project">
      
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

  </div>
  <div v-else class="p-8 text-center text-gray-500">
      Cargando proyecto...
  </div>
</template>
