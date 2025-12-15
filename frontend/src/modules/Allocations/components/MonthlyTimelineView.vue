<script setup>
import { Network } from 'lucide-vue-next'
import { dayjs } from '@/config'
import { stringToColor } from '@/helper/Colors'

const props = defineProps({
    projects: { type: Array, default: () => [] },
    timelineItems: { type: Array, default: () => [] },
    zoomLevel: String,
    absences: { type: Array, default: () => [] }
})

const emit = defineEmits(['open-hierarchy'])

const isToday = (dateObj) => {
    return dayjs(dateObj).isSame(dayjs(), 'day')
}

const getTypeColor = (milestoneOrType) => {
    let color = null
    if (typeof milestoneOrType === 'object' && milestoneOrType.milestoneType) {
        color = milestoneOrType.milestoneType.color
    } else if (milestoneOrType?.color) {
        color = milestoneOrType.color
    }
    
    if (color) {
        if (color.startsWith('#') || color.startsWith('rgb')) {
            return `bg-[${color}]`
        }
        return color
    }

    if (typeof milestoneOrType === 'string') {
        return `bg-[${stringToColor(milestoneOrType)}]`
    }
    
    return 'bg-gray-400'
}

const getMilestonesForKey = (project, key) => {
    if (!project.milestones || !project.milestones.length) return []
    
    return project.milestones.filter(m => {
        if (props.zoomLevel === 'month') {
             return dayjs(m.date).format('YYYY-MM') === key
        } else {
             let mKey = dayjs(m.date).format('YYYY-MM-DD')
             return mKey === key
        }
    })
}

const getAbsencesForKey = (project, item) => {
    if (props.zoomLevel === 'month') return []
    if (!project.allocations || !props.absences) return []
    
    const currentKey = item.key 
    const projectCollaboratorIds = project.allocations.map(a => a.collaborator.id)
    
    return props.absences.filter(a => {
        if (!projectCollaboratorIds.includes(a.collaboratorId)) return false
        // Format absence dates to YYYY-MM-DD calling split to ignore timezone shifts
        // (Assumes backend stores dates as YYYY-MM-DDT00:00:00Z and represents "that day")
        const startKey = a.startDate.split('T')[0]
        const endKey = a.endDate.split('T')[0]
        
        // Debug for a specific date range of interest
        if (currentKey >= '2025-12-15' && currentKey <= '2025-12-19') {
             console.log(`Checking ${currentKey} against ${startKey}-${endKey} for ${a.collaboratorId}`)
             if (currentKey >= startKey && currentKey <= endKey) {
                 console.log('MATCH FOUND', currentKey)
             }
        }
        
        // Inclusive comparison of date strings
        return currentKey >= startKey && currentKey <= endKey
    }).map(a => {
        const alloc = project.allocations.find(all => all.collaborator.id === a.collaboratorId)
        return {
            ...a,
            collaboratorName: alloc?.collaborator.firstName || '?',
            collaboratorAvatar: alloc?.collaborator.firstName?.charAt(0) || '?'
        }
    })
}
</script>

<template>
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 min-h-0 overflow-auto relative">
             <div class="flex border-b border-gray-200 text-sm font-bold text-gray-700 bg-gray-50 sticky top-0 z-30 min-w-max">
                  <div class="w-64 p-4 border-r border-gray-200 shrink-0 uppercase tracking-wider text-xs sticky left-0 bg-gray-50 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Proyecto
                  </div>
                  <div class="flex">
                      <div v-for="item in timelineItems" :key="item.key" 
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
             
             <div class="flex flex-col min-w-max">
                  <div v-for="project in projects" :key="project.id" class="flex hover:bg-gray-50 h-16 relative group border-b border-gray-100">
                       <div class="w-64 p-4 border-r border-gray-200 shrink-0 flex items-center justify-between font-medium text-gray-800 text-sm sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 transition-colors">
                           <span>{{ project.name }}</span>
                           <button @click="emit('open-hierarchy', project)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Jerarquía">
                               <Network size="16"/>
                           </button>
                       </div>
                       
                       <div class="flex">
                            <div v-for="item in timelineItems" :key="item.key" 
                                 class="shrink-0 border-r border-gray-100 relative flex items-center justify-center transition-colors box-border"
                                 :class="[
                                     item.isWeekend ? 'bg-gray-100/50' : '',
                                     zoomLevel === 'day' ? 'w-10' : 'min-w-[80px] w-auto',
                                     isToday(item.date) ? 'bg-blue-50/50 border-b-2 border-b-blue-400' : ''
                                 ]">
                                 
                                 <template v-for="m in getMilestonesForKey(project, item.key)" :key="m.id">
                                     <div class="w-4 h-4 rounded-full border-2 border-white shadow cursor-help transform hover:scale-125 z-20 relative"
                                          :class="getTypeColor(m)"
                                          :title="m.name + ' (' + m.date + ')'">
                                     </div>
                                 </template>

                                 <div v-if="getAbsencesForKey(project, item).length > 0" class="flex -space-x-1 absolute bottom-0.5 right-0.5">
                                      <div v-for="abs in getAbsencesForKey(project, item)" :key="abs.id"
                                           class="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-bold z-10"
                                           :style="{ backgroundColor: abs.type.color }"
                                           :title="abs.collaboratorName + ': ' + abs.type.name"
                                      >
                                          {{ abs.collaboratorAvatar }}
                                      </div>
                                 </div>
                            </div>
                       </div>
                  </div>
                  
                  <div v-if="projects.length === 0" class="p-8 text-center text-gray-400 sticky left-0">
                      No hay proyectos
                  </div>
             </div>
      </div>
</template>
