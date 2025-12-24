<script setup>
import { watch, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'

import SkillRadarChart from './SkillRadarChart.vue'
import CareerObjectives from './CareerObjectives.vue'
import CollaboratorMeetings from './CollaboratorMeetings.vue'
import { X, Trophy, History } from 'lucide-vue-next'

const props = defineProps({
    show: Boolean,
    collaboratorId: String
})
const emit = defineEmits(['close'])

import { GET_COLLABORATOR_CAREER_PLAN } from '../graphql/collaborator.queries'

const { result, loading, error, refetch } = useQuery(GET_COLLABORATOR_CAREER_PLAN, 
    () => ({ id: props.collaboratorId }),
    () => ({ enabled: !!props.collaboratorId, fetchPolicy: 'network-only' })
)

watch(() => props.show, (val) => {
    if (val && props.collaboratorId) {
        refetch()
    }
})


const availableSkills = computed(() => {
    if (!result.value?.collaborator) return []
    const skills = new Map()
    // Add current skills
    result.value.collaborator.skills.forEach(s => {
        if (s.skill) skills.set(s.skill.id, s.skill)
    })
    // Add project skills
    result.value.collaborator.projectSkills.forEach(s => {
        if (!skills.has(s.id)) skills.set(s.id, s)
    })
    return Array.from(skills.values()).sort((a, b) => a.name.localeCompare(b.name))
})

</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all" @click.self="emit('close')">
    <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div class="flex items-center gap-3">
               <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-blue-200 shadow-md">
                    {{ result?.collaborator?.firstName?.charAt(0) }}
               </div>
               <div>
                    <h2 class="text-xl font-bold text-gray-800" v-if="result?.collaborator">
                        {{ result.collaborator.firstName }} {{ result.collaborator.lastName }}
                    </h2>
                    <p class="text-blue-600 text-xs font-semibold uppercase tracking-wide">Plan de Carrera & Desarrollo</p>
               </div>
           </div>
           <button @click="emit('close')" class="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 hover:text-gray-600 transition-all">
               <X size="20" />
           </button>
        </div>

        <div class="flex-1 overflow-y-auto bg-white custom-scrollbar" v-if="loading">
             <div class="flex flex-col items-center justify-center h-full py-20 text-gray-400 gap-3">
                 <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                 <span class="text-sm">Cargando perfil profesional...</span>
             </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-white p-8 flex flex-col items-center justify-center text-red-500" v-else-if="error">
            <div class="bg-red-50 p-4 rounded-lg flex items-center gap-3">
                 <X size="24" />
                 <div>
                     <p class="font-bold">Error al cargar el perfil</p>
                     <p class="text-sm">{{ error.message }}</p>
                 </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-10 bg-white custom-scrollbar" v-else-if="result?.collaborator">
            
            <section>
                <div class="flex items-center gap-2 mb-6">
                    <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><Trophy size="20" /></div>
                    <h3 class="text-lg font-bold text-gray-800">Mapa de Competencias</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative">
                        <SkillRadarChart 
                            :current-skills="result.collaborator.skills" 
                            :project-skills="result.collaborator.projectSkills" 
                        />
                    </div>
                    <div class="md:col-span-2 bg-gray-50 rounded-2xl p-6 space-y-4">
                        <h4 class="font-semibold text-gray-700 text-sm">Resumen de Habilidades</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Skills Totales</span>
                                <span class="font-mono font-bold text-gray-800">{{ result.collaborator.skills.length }}</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Skills de Proyecto</span>
                                <span class="font-mono font-bold text-gray-800">{{ result.collaborator.projectSkills.length }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>

                    <CareerObjectives 
                        :objectives="result.collaborator.careerObjectives" 
                        :collaborator-id="result.collaborator.id"
                        :available-skills="availableSkills" 
                        @refetch="refetch"
                    />
                </section>
                
                <section>
                    <div class="flex items-center gap-2 mb-6">
                         <div class="p-2 bg-green-50 text-green-600 rounded-lg"><History size="20" /></div>
                        <h3 class="text-lg font-bold text-gray-800">Historial de Progreso</h3>
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div class="max-h-[400px] overflow-y-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Habilidad</th>
                                        <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Nivel</th>
                                        <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    <tr v-for="hist in result.collaborator.skillHistory" :key="hist.id" class="hover:bg-gray-50 transition-colors">
                                        <td class="px-4 py-3 font-medium text-gray-700">{{ hist.skill.name }}</td>
                                        <td class="px-4 py-3">
                                            <div class="flex gap-0.5">
                                                <div v-for="i in 4" :key="i" class="w-1.5 h-3 rounded-full" :class="i <= hist.level ? 'bg-green-500' : 'bg-gray-200'"></div>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(hist.createdAt).toLocaleDateString() }}</td>
                                    </tr>
                                    <tr v-if="result.collaborator.skillHistory.length === 0">
                                        <td colspan="3" class="px-4 py-8 text-center text-gray-400 text-xs">Sin historial registrado</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            <section>

                <CollaboratorMeetings 
                    :meetings="result.collaborator.meetings" 
                    :collaborator-id="result.collaborator.id"
                    :collaborator-name="`${result.collaborator.firstName} ${result.collaborator.lastName}`"
                    @refetch="refetch"
                />
            </section>

        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #f1f1f1;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
}
</style>
