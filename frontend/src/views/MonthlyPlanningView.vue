<script setup>
import { computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PLANNING_PROJECTS } from '@/modules/Projects/graphql/project.queries'
import { UPDATE_WORK_PACKAGE } from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'
import MonthlyPlanningGantt from '@/modules/Allocations/components/Planning/MonthlyPlanningGantt.vue'

import { GET_WORK_PACKAGE_STATUSES } from '@/modules/Configuration/graphql/status.queries'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'

const authStore = useAuthStore()

const { result, loading, error, refetch } = useQuery(GET_PLANNING_PROJECTS)
const { result: statusesResult } = useQuery(GET_WORK_PACKAGE_STATUSES, () => ({
    organizationId: authStore.user?.organizationId
}), {
    enabled: computed(() => !!authStore.user?.organizationId)
})

const { mutate: updateWorkPackage } = useMutation(UPDATE_WORK_PACKAGE)
const notificationStore = useNotificationStore()

const projects = computed(() => {
    if (!result.value?.projects) return []
    
    const activeStatuses = (statusesResult.value?.workPackageStatuses || [])
        .filter(s => !s.isClosed)
        .map(s => s.name)

    return result.value.projects.map(p => {
        const planningWPs = p.workPackages?.filter(wp => {
             const s = wp.status || ''
             if (!s) return true
             if (activeStatuses.length === 0) return true
             return activeStatuses.includes(s)
        }) || []
        
        return {
            ...p,
            workPackages: planningWPs
        }
    }).filter(p => p.workPackages.length > 0)
})

const handleUpdateStatus = async ({ id, status }) => {
    try {
        await updateWorkPackage({ id, status })
        notificationStore.showToast('Estado actualizado correctamente', 'success')
        refetch()
    } catch (e) {
        notificationStore.showToast('Error al actualizar estado', 'error')
        console.error(e)
    }
}
</script>

<template>
  <div class="container mx-auto p-6 flex flex-col h-screen">
    <h1 class="text-3xl font-bold mb-4 text-gray-800">Planificación Mensual</h1>
    
    <div v-if="loading" class="text-center py-10">
        <p class="text-gray-500">Cargando planificación...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
        Error al cargar proyectos: {{ error.message }}
    </div>

    <div v-else class="flex-1 overflow-hidden">
        <MonthlyPlanningGantt 
            :projects="projects"
            @update-work-package-status="handleUpdateStatus"
        />
    </div>
  </div>
</template>
