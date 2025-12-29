<script setup>
import { ref, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useNotificationStore } from '@/stores/notificationStore'
import WorkSchedulePicker from '@/components/WorkSchedulePicker.vue'
import { Clock } from 'lucide-vue-next'
import { GET_ORGANIZATION, UPDATE_ORGANIZATION } from '../graphql/organization.queries'

const { result, loading } = useQuery(GET_ORGANIZATION)
const { mutate: updateOrganization, loading: updating } = useMutation(UPDATE_ORGANIZATION)
const notificationStore = useNotificationStore()

const schedule = ref(null)

watch(result, (val) => {
    if (val?.organization?.workingSchedule) {
        schedule.value = typeof val.organization.workingSchedule === 'string' 
            ? JSON.parse(val.organization.workingSchedule) 
            : val.organization.workingSchedule
    } else {
        schedule.value = null
    }
}, { immediate: true })

const handleSave = async () => {
    try {
        await updateOrganization({
            workingSchedule: schedule.value
        })
        notificationStore.showToast('Horario de la organización actualizado', 'success')
    } catch {
        notificationStore.showToast('Error al guardar el horario', 'error')
    }
}
</script>

<template>
    <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Clock size="24" />
            </div>
            <div>
                <h3 class="font-bold text-gray-900 text-lg">Jornada Laboral</h3>
                <p class="text-sm text-gray-500">Configura los días y horarios laborales por defecto para toda la organización.</p>
            </div>
        </div>

        <div v-if="loading" class="text-center py-4">Cargando...</div>
        
        <div v-else>
            <WorkSchedulePicker v-model="schedule" :disabled="updating" />
            
            <div class="mt-6 flex justify-end">
                <button 
                    @click="handleSave" 
                    :disabled="updating"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    <span v-if="updating">Guardando...</span>
                    <span v-else>Guardar Horario Global</span>
                </button>
            </div>
        </div>
    </div>
</template>
