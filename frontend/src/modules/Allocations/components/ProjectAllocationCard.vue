<script setup>
import { Network, GripVertical, CheckCircle, AlertCircle, Trash2, X, Plus, Calculator } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import ProjectMilestones from '@/components/ProjectMilestones.vue'
import { ref } from 'vue'

const props = defineProps({
    project: Object,
    currentWeek: String,
    dragging: Boolean,
    absences: Array,
    getSkillMatch: Function,
    getGlobalOccupation: Function
})

const emit = defineEmits([
    'drop', 
    'delete-allocation', 
    'update-allocation-percentage',
    'add-role',
    'remove-role',
    'open-hierarchy'
])

const addingRoleToAllocId = ref(null)

const getAvailableRolesToAdd = (project, currentRoles) => {
    const all = project.requiredRoles?.map(r => r.role) || []
    const currentIds = currentRoles.map(r => r.id)
    return all.filter(r => !currentIds.includes(r.id))
}

const onDrop = (evt) => {
    emit('drop', evt, props.project.id)
}

const getAbsenceInWeek = (collaboratorId) => {
    if (!props.absences || !collaboratorId) return null
    return props.absences.find(a => {
        return a.collaborator.id === collaboratorId && doesOverlap(a, props.currentWeek)
    })
}

import { dayjs } from '@/config'

const doesOverlap = (absence, weekStr) => {
    const [y, w] = weekStr.split('-W').map(Number)
    const wStart = dayjs().year(y).isoWeek(w).startOf('isoWeek')
    const wEnd = dayjs().year(y).isoWeek(w).endOf('isoWeek')
    const aStart = dayjs(absence.startDate)
    const aEnd = dayjs(absence.endDate)
    return aStart.isBefore(wEnd.add(1, 'day')) && aEnd.isAfter(wStart.subtract(1, 'day'))
}

import { computed } from 'vue'

const totalAllocatedHours = computed(() => {
    if (!props.project.allocations) return 0
    const total = props.project.allocations.reduce((acc, alloc) => {
        //TODO las 40  tendrian que ser configurables
        const contractHours = alloc.collaborator?.contractedHours || 40
        const percentage = alloc.dedicationPercentage || 0
        const hours = contractHours * (percentage / 100)
        return acc + hours
    }, 0)
    return Math.round(total * 10) / 10
})

</script>

<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[300px]">
          <div class="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
             <div class="flex justify-between items-start mb-2">
               <div class="flex items-center gap-2">
                   <h3 class="font-bold text-lg text-gray-800">{{ project.name }}</h3>
                   <button @click="emit('open-hierarchy', project)" class="p-1 px-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Jerarquía">
                       <Network size="16"/>
                   </button>
                   <router-link :to="{ name: 'project-estimation', params: { id: project.id } }" class="p-1 px-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Estimación">
                       <Calculator size="16"/>
                   </router-link>
               </div>
               <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold"
                     :class="{'bg-red-100 text-red-700': totalAllocatedHours > project.contractedHours, 'bg-green-100 text-green-700': totalAllocatedHours <= project.contractedHours && totalAllocatedHours > 0}">
                   {{ totalAllocatedHours }} / {{ project.contractedHours }} h
               </span>
             </div>
              <div class="flex flex-wrap gap-1">
               <template v-for="req in project.requiredRoles" :key="req.id">
                   <span v-for="skill in req.skills" :key="skill.id" class="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded" :title="req.role.name">
                     {{ skill.name }}
                   </span>
               </template>
              </div>
          </div>
          
          <ProjectMilestones :project="project" :currentWeek="currentWeek" />

          <div class="flex-1 p-3 bg-gray-50/30 overflow-y-auto max-h-[500px]">
            <draggable 
              :list="project.allocations || []" 
              group="people" 
              item-key="id"
              class="h-full min-h-[100px] space-y-2 rounded-lg border-2 border-dashed border-transparent transition-colors"
              :class="{ 'border-blue-200 bg-blue-50/50': dragging }"
              @change="onDrop"
            >
               <template #item="{ element }">
                 <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2 group relative">
                    
                    <div class="flex items-center gap-3">
                      <GripVertical class="text-gray-300 cursor-grab active:cursor-grabbing" size="14" />
                       <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
                         {{ (element.collaborator?.firstName || element.collaborator?.name || element.name || '?').charAt(0) }}
                       </div>
                       <div class="flex-1">
                         <div class="font-medium text-sm flex items-start gap-x-2 flex-col">
                            <span>
                            {{ element.collaborator?.firstName }} {{ element.collaborator?.lastName }} 
                            </span>
                            <span v-if="!element.collaborator?.firstName && !element.collaborator?.lastName" class="text-gray-400 text-xs">
                                {{ element.collaborator?.name || element.name || 'Sin nombre' }}
                            </span>
                            


                            <span v-if="getAbsenceInWeek(element.collaborator?.id)" 
                                   class="px-1.5 py-0.5 rounded text-[8px] font-bold border truncate max-w-[100px]"
                                   :style="{ 
                                       backgroundColor: getAbsenceInWeek(element.collaborator?.id).type.color + '20', 
                                       color: getAbsenceInWeek(element.collaborator?.id).type.color,
                                       borderColor: getAbsenceInWeek(element.collaborator?.id).type.color + '40'
                                   }"
                                   :title="getAbsenceInWeek(element.collaborator?.id).type.name">
                                 <span class="opacity-80 ml-0.5">({{ getAbsenceInWeek(element.collaborator?.id).daysConsumed }}d)</span>
                                 {{ getAbsenceInWeek(element.collaborator?.id).type.name }}
                            </span>
                         </div>
                       </div>
                       
                       <div class="flex items-center gap-2">
                           <div v-if="getSkillMatch(element.collaborator || element, project).status === 'good'" class="text-green-500" title="Skills Match">
                               <CheckCircle size="14" />
                           </div>
                           <div v-else class="text-amber-400" title="Low Skill Match">
                               <AlertCircle size="14" />
                           </div>
                           
                           <button @click="emit('delete-allocation', element.id)" class="text-gray-300 hover:text-red-500 transition-colors">
                               <Trash2 size="14" />
                           </button>
                       </div>
                    </div>

                    <div class="flex items-start justify-between border-t border-gray-50 pt-2 gap-2">
                        <div class="flex-1 flex flex-wrap gap-1">
                             <div v-for="role in element.roles" :key="role.id" 
                                class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                {{ role.name }}
                                <button @click="emit('remove-role', element, role.id)" class="hover:text-red-500"><X size="10"/></button>
                             </div>
                             
                             <div class="relative">
                                 <button @click="addingRoleToAllocId = (addingRoleToAllocId === element.id ? null : element.id)" 
                                         class="text-blue-500 hover:bg-blue-50 p-0.5 rounded">
                                     <Plus size="14" />
                                 </button>
                                 <div v-if="addingRoleToAllocId === element.id" class="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded p-1 z-20 w-32">
                                     <div v-for="r in getAvailableRolesToAdd(project, element.roles)" :key="r.id" 
                                          @click="emit('add-role', element, r.id); addingRoleToAllocId = null"
                                          class="text-xs p-1 hover:bg-gray-100 cursor-pointer rounded">
                                         {{ r.name }}
                                     </div>
                                     <div v-if="getAvailableRolesToAdd(project, element.roles).length === 0" class="text-[10px] text-gray-400 p-1">
                                         Sin roles disponibles
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div class="text-xs text-green-600 font-medium flex items-center gap-1 shrink-0">
                           <input type="number" 
                                  :value="element.dedicationPercentage || 50" 
                                  @change="(e) => emit('update-allocation-percentage', element, e.target.value)"
                                  class="w-11 border rounded px-1 py-0.5 text-xs text-center focus:ring-1 focus:ring-green-500 outline-none"
                                  min="0" max="100" />
                           % <span v-if="getGlobalOccupation && element.collaborator?.id" 
                                   class="text-gray-400 font-normal ml-1"
                                   :class="{'text-red-500 font-bold': getGlobalOccupation(element.collaborator.id) > 100}">
                               / {{ getGlobalOccupation(element.collaborator.id) }}%
                           </span>
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
</template>
