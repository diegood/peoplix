<script setup>
import { computed } from 'vue'
import { Calendar, CheckSquare } from 'lucide-vue-next'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const progressText = computed(() => {
  if (!props.card.children?.length) return ''
  const completed = props.card.children.filter(c => c.status === 'done').length
  return `${completed}/${props.card.children.length}`
})

const progressPercentage = computed(() => {
    if (!props.card.children?.length) return 0
    const completed = props.card.children.filter(c => c.status === 'done').length
    return (completed / props.card.children.length) * 100
})

const isOverdue = computed(() => {
    if (!props.card.endDate) return false
    return new Date(parseInt(props.card.endDate)) < new Date() && props.card.status !== 'done'
})

const formatDate = (val) => {
    if (!val) return ''
    const d = new Date(parseInt(val))
    return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })
}

const riskColor = computed(() => {
    switch (props.card.risk) {
        case 'HIGH': return 'bg-red-50 text-red-600'
        case 'MEDIUM': return 'bg-yellow-50 text-yellow-600'
        case 'LOW': return 'bg-blue-50 text-blue-600'
        default: return 'bg-gray-100 text-gray-500'
    }
})
</script>

<template>
  <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative group">
    <!-- Header: Project or Breadcrumbs -->
    <div v-if="card.breadcrumbs?.length" class="text-[10px] text-gray-400 mb-2 flex items-center gap-1 flex-wrap font-medium">
       <span v-for="(bc, index) in card.breadcrumbs" :key="bc.id">
           {{ bc.readableId }} <span v-if="index < card.breadcrumbs.length - 1">></span>
       </span>
       <span>></span>
    </div>

    <!-- Title and ID -->
    <div class="flex justify-between items-start mb-2">
       <h4 class="text-sm font-semibold text-gray-800 leading-snug">{{ card.title }}</h4>
       <span v-if="card.risk !== 'NONE'" :class="['text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 whitespace-nowrap', riskColor]">
           {{ card.risk }}
       </span>
    </div>
    
    <!-- Subtask Progress Bar -->
    <div v-if="card.children?.length" class="mb-3">
        <div class="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Progreso</span>
            <span>{{ progressText }}</span>
        </div>
        <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full transition-all duration-500" :style="{ width: progressPercentage + '%' }"></div>
        </div>
    </div>

    <!-- Info Row: Date & ID -->
    <div class="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span class="font-mono bg-gray-50 px-1 rounded border border-gray-100">{{ card.readableId }}</span>
        <div v-if="card.endDate" class="flex items-center gap-1" :class="{'text-red-500': isOverdue}">
             <Calendar class="w-3 h-3" />
             <span>{{ formatDate(card.endDate) }}</span>
        </div>
    </div>

    <!-- Subtasks List -->
    <div v-if="card.children?.length" class="bg-blue-50/50 rounded-md p-2 space-y-1 mb-3">
        <div v-for="child in card.children" :key="child.id" class="flex items-center gap-2 text-xs">
            <div class="w-3 h-3 rounded border border-blue-400 bg-white flex items-center justify-center shrink-0">
                <div v-if="child.status === 'done'" class="w-1.5 h-1.5 bg-blue-500 rounded-[1px]"></div>
            </div>
            <span :class="['truncate text-gray-600', child.status === 'done' ? 'line-through opacity-60' : '']">
                {{ child.title }}
            </span>
        </div>
    </div>

    <!-- Footer: Collaborators & Comments -->
    <div class="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
       <div class="flex -space-x-1.5">
          <div v-for="collab in card.collaborators" :key="collab.id" 
               class="w-5 h-5 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[9px] font-medium text-gray-600 shadow-sm overflow-hidden"
               :title="collab.firstName">
             <img v-if="collab.avatar" :src="collab.avatar" class="w-full h-full object-cover">
             <span v-else>{{ collab.firstName[0] }}</span>
          </div>
       </div>
       
       <!-- Comment/Subtask Counts (Alternative view) -->
       <div class="flex items-center gap-2 text-gray-400 text-[10px]">
           <!-- Can add comment count here later -->
       </div>
    </div>
  </div>
</template>
