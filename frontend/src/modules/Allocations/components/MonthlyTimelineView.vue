<script setup>
import { Network } from 'lucide-vue-next'
import { dayjs } from '@/config'

const props = defineProps({
    projects: { type: Array, default: () => [] },
    timelineItems: { type: Array, default: () => [] },
    zoomLevel: String
})

const emit = defineEmits(['open-hierarchy'])

const isToday = (dateObj) => {
    return dayjs(dateObj).isSame(dayjs(), 'day')
}

const getTypeColor = (milestoneOrType) => {
    if (typeof milestoneOrType === 'object' && milestoneOrType.milestoneType) {
        return milestoneOrType.milestoneType.color
    }
    if (typeof milestoneOrType === 'string') {
        switch (milestoneOrType) {
            case 'Delivery': return 'bg-red-400'
            case 'Meeting': return 'bg-blue-400'
            case 'DevOps': return 'bg-green-400'
             default: return 'bg-purple-400'
        }
    }
    return milestoneOrType?.color || 'bg-gray-400'
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
</script>

<template>
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 min-h-0 overflow-auto relative">
             <!-- Timeline Header Row -->
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
             
             <!-- Body Rows -->
             <div class="flex flex-col min-w-max">
                  <div v-for="project in projects" :key="project.id" class="flex hover:bg-gray-50 h-16 relative group border-b border-gray-100">
                       <!-- Project Info (Sticky Left) -->
                       <div class="w-64 p-4 border-r border-gray-200 shrink-0 flex items-center justify-between font-medium text-gray-800 text-sm sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 transition-colors">
                           <span>{{ project.name }}</span>
                           <button @click="emit('open-hierarchy', project)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Jerarquía">
                               <Network size="16"/>
                           </button>
                       </div>
                       
                       <!-- Timeline Cells -->
                       <div class="flex">
                            <div v-for="item in timelineItems" :key="item.key" 
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
                  
                  <div v-if="projects.length === 0" class="p-8 text-center text-gray-400 sticky left-0">
                      No hay proyectos
                  </div>
             </div>
      </div>
</template>
