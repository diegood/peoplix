<script setup>
import { stringToColor } from '@/helper/Colors'
defineProps({
    milestones: { type: Array, default: () => [] }
})

const getTypeColor = (milestoneOrType) => {
    let color = null
    if (typeof milestoneOrType === 'object' && milestoneOrType.milestoneType) {
        color = milestoneOrType.milestoneType.color
    }
    
    if (color) {
        if (color.startsWith('#') || color.startsWith('rgb')) {
            return `bg-[${color}]`
        }
        return color
    }
    
    // Fallback string gen
    const str = typeof milestoneOrType === 'string' ? milestoneOrType : (milestoneOrType?.type || '?')
    return `bg-[${stringToColor(str)}]`
}
</script>

<template>
    <div v-if="milestones.length > 0" class="flex items-center gap-2 mt-1 text-xs text-gray-500 overflow-x-auto max-w-lg">
        <span class="font-semibold text-gray-700">Hitos de la semana:</span>
        <div v-for="g in milestones" :key="g.projectId" class="flex items-center gap-2 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            <div class="flex -space-x-1">
                    <div v-for="m in g.milestones" :key="m.id" 
                        class="w-2.5 h-2.5 rounded-full border border-white" 
                        :class="getTypeColor(m.type)" 
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
