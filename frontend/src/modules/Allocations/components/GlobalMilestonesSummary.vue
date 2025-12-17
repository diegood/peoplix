<script setup>
import { stringToColor } from '@/helper/Colors'
defineProps({
    milestones: { type: Array, default: () => [] }
})

const getMilestoneStyle = (milestoneOrType) => {
    let color = null
    if (milestoneOrType?.milestoneType?.color) {
        color = milestoneOrType.milestoneType.color
    }

    if (color && (color.startsWith('#') || color.startsWith('rgb'))) {
        return { backgroundColor: color }
    }
    
    const str = typeof milestoneOrType === 'string' ? milestoneOrType : (milestoneOrType?.type || '?')
    if (!color) return { backgroundColor: stringToColor(str) }
    return {} 
}

const getMilestoneClass = (milestoneOrType) => {
     let color = milestoneOrType?.milestoneType?.color
     if (color && !color.startsWith('#') && !color.startsWith('rgb')) {
         return color
     }
     return ''
}
</script>

<template>
    <div v-if="milestones.length > 0" class="flex items-center gap-2 mt-1 text-xs text-gray-500 overflow-x-auto max-w-lg">
        <span class="font-semibold text-gray-700">Hitos de la semana:</span>
        <div v-for="g in milestones" :key="g.projectId" class="flex items-center gap-2 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            <div class="flex -space-x-1">
                    <div v-for="m in g.milestones" :key="m.id" 
                        class="w-2.5 h-2.5 rounded-full border border-white" 
                        :class="getMilestoneClass(m)" 
                        :style="getMilestoneStyle(m)"
                        :title="m.name + ' (' + m.date + ')'">
                    </div>
            </div>
            <span class="text-gray-700 font-medium">
                <span v-if="g.count > 1" class="font-bold">({{ g.count }})</span>
                {{ g.projectName }}
            </span>
        </div>
    </div>
    <div v-else class="text-xs text-gray-400 mt-1 italic">Sin hitos esta semana</div>
</template>
