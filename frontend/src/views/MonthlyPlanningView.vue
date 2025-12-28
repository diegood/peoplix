<script setup>
import { computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PLANNING_PROJECTS } from '@/graphql/queries'
import { UPDATE_WORK_PACKAGE } from '@/graphql/mutations'
import { useNotificationStore } from '@/stores/notificationStore'
import MonthlyPlanningGantt from '@/modules/Allocations/components/Planning/MonthlyPlanningGantt.vue'

const { result, loading, error, refetch } = useQuery(GET_PLANNING_PROJECTS)
const { mutate: updateWorkPackage } = useMutation(UPDATE_WORK_PACKAGE)
const notificationStore = useNotificationStore()

const projects = computed(() => {
    if (!result.value?.projects) return []
    
    return result.value.projects.map(p => {
        const planningWPs = p.workPackages?.filter(wp => {
             const s = wp.status || ''
             return ['BACKLOG', 'TO_DO', 'TODO', 'Por hacer', 'IN_PROGRESS', 'EN_PROGRESO', 'En progreso', 'En Progreso'].includes(s)
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
