<script setup>
import { computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import RasciCell from './RasciCell.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { Loader2 } from 'lucide-vue-next'
import { GET_RASCI_DATA, ADD_RESPONSIBILITY, REMOVE_RESPONSIBILITY } from '../graphql/rasci'

const props = defineProps({
  project: { type: Object, required: true },
  allocations: { type: Array, default: () => [] }
})

const notificationStore = useNotificationStore()

const { result, loading, refetch, onError } = useQuery(GET_RASCI_DATA, 
  () => ({ projectId: props.project.id }),
  { fetchPolicy: 'network-only' }
)

onError((error) => {
    notificationStore.showToast("Error cargando matriz: " + error.message, 'error')
    console.error("RASCI Load Error:", error)
})

const { mutate: addResponsibility } = useMutation(ADD_RESPONSIBILITY)
const { mutate: removeResponsibility } = useMutation(REMOVE_RESPONSIBILITY)

const workPackages = computed(() => result.value?.project?.workPackages || [])
const requirements = computed(() => result.value?.project?.functionalRequirements || [])
const responsibilities = computed(() => result.value?.project?.responsibilities || [])

const sortedAllocations = computed(() => {
    return [...props.allocations].sort((a,b) => {
        const nameA = a.collaborator?.userName || ''
        const nameB = b.collaborator?.userName || ''
        return nameA.localeCompare(nameB)
    })
})

const getResp = (rowId, rowType, allocationId) => {
    return responsibilities.value.find(r => 
        r.allocationId === allocationId &&
        (
            (rowType === 'WP' && r.workPackageId === rowId) ||
            (rowType === 'FR' && r.functionalRequirementId === rowId) ||
            (rowType === 'ALLOC' && r.targetAllocationId === rowId)
        )
    )
}

const handleUpdate = async (newRole, rowId, rowType, allocationId) => {
    const existing = getResp(rowId, rowType, allocationId)
    
    try {
        if (existing) {
             await removeResponsibility({ id: existing.id })
        }
        
        if (newRole) {
            const variables = {
                projectId: props.project.id,
                allocationId: allocationId,
                role: newRole,
                workPackageId: rowType === 'WP' ? rowId : null,
                functionalRequirementId: rowType === 'FR' ? rowId : null,
                targetAllocationId: rowType === 'ALLOC' ? rowId : null,
            }
            await addResponsibility(variables)
         }
         
         await refetch()
         notificationStore.showToast('Matriz actualizada', 'success')
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al actualizar: ' + e.message, 'error')
    }
}

const getDisplayName = (collab) => {
    if (!collab) return '?'
    return collab.userName || `${collab.firstName} ${collab.lastName}`
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
      <div v-if="loading" class="flex-1 flex items-center justify-center">
          <Loader2 class="animate-spin text-blue-500 opacity-50" />
      </div>
      
      <div v-else class="flex-1 overflow-auto relative">
          <table class="w-full text-sm border-collapse">
            <thead class="sticky top-0 bg-white shadow-sm z-20">
                <tr>
                    <th class="p-3 text-left font-bold text-gray-900 bg-gray-50 border-b border-gray-200 min-w-[300px] sticky left-0 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.05)]">
                        Entregable / Recurso
                    </th>
                    <th v-for="alloc in sortedAllocations" :key="alloc.id" class="p-2 min-w-[80px] text-center border-b border-gray-200 font-medium text-gray-600">
                        <div class="flex flex-col items-center gap-1 group relative">
                             <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 text-xs">
                                {{ getDisplayName(alloc.collaborator).substring(0,2).toUpperCase() }}
                             </div>
                             <!-- Tooltip -->
                             <span class="absolute top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                 {{ getDisplayName(alloc.collaborator) }}
                             </span>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                
                <!-- Work Packages -->
                <tr v-if="workPackages.length > 0" class="bg-gray-100/50">
                    <td :colspan="sortedAllocations.length + 1" class="p-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-100/90 backdrop-blur-sm">
                        Paquetes de Trabajo
                    </td>
                </tr>
                <tr v-for="wp in workPackages" :key="wp.id" class="hover:bg-blue-50/10 transition group">
                    <td class="p-3 border-r border-gray-100 text-gray-700 font-medium sticky left-0 z-10 bg-white group-hover:bg-blue-50 transition border-r-gray-200/50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                        {{ wp.name }}
                    </td>
                    <td v-for="alloc in sortedAllocations" :key="alloc.id" class="p-1 border-r border-dashed border-gray-100 last:border-0 text-center relative">
                         <RasciCell 
                            :role="getResp(wp.id, 'WP', alloc.id)?.role"
                            @update="(role) => handleUpdate(role, wp.id, 'WP', alloc.id)"
                         />
                    </td>
                </tr>

                <tr v-if="requirements.length > 0" class="bg-gray-100/50">
                    <td :colspan="sortedAllocations.length + 1" class="p-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-100/90 backdrop-blur-sm">
                        Requisitos Funcionales
                    </td>
                </tr>
                <tr v-for="fr in requirements" :key="fr.id" class="hover:bg-blue-50/10 transition group">
                    <td class="p-3 border-r border-gray-100 text-gray-700 font-medium sticky left-0 z-10 bg-white group-hover:bg-blue-50 transition border-r-gray-200/50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                        {{ fr.title }}
                    </td>
                    <td v-for="alloc in sortedAllocations" :key="alloc.id" class="p-1 border-r border-dashed border-gray-100 last:border-0 text-center relative">
                         <RasciCell 
                            :role="getResp(fr.id, 'FR', alloc.id)?.role"
                            @update="(role) => handleUpdate(role, fr.id, 'FR', alloc.id)"
                         />
                    </td>
                </tr>

                <tr v-if="sortedAllocations.length > 0" class="bg-gray-100/50">
                    <td :colspan="sortedAllocations.length + 1" class="p-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-100/90 backdrop-blur-sm">
                        Gestión de Personas (Responsabilidades hacia otros)
                    </td>
                </tr>
                <tr v-for="targetAlloc in sortedAllocations" :key="targetAlloc.id" class="hover:bg-blue-50/10 transition group">
                    <td class="p-3 border-r border-gray-100 text-gray-700 font-medium sticky left-0 z-10 bg-white group-hover:bg-blue-50 transition border-r-gray-200/50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">{{ getDisplayName(targetAlloc.collaborator).substring(0,2).toUpperCase() }}</span>
                            {{ getDisplayName(targetAlloc.collaborator) }}
                        </div>
                    </td>
                    <td v-for="alloc in sortedAllocations" :key="alloc.id" :class="['p-1 border-r border-dashed border-gray-100 last:border-0 text-center relative', alloc.id === targetAlloc.id ? 'bg-gray-50' : '']">
                         <div v-if="alloc.id === targetAlloc.id" class="w-full h-full flex items-center justify-center opacity-20 text-xl font-bold text-gray-300">
                             /
                         </div>
                         <RasciCell v-else
                            :role="getResp(targetAlloc.id, 'ALLOC', alloc.id)?.role"
                            @update="(role) => handleUpdate(role, targetAlloc.id, 'ALLOC', alloc.id)"
                         />
                    </td>
                </tr>

            </tbody>
          </table>
      </div>
  </div>
</template>
