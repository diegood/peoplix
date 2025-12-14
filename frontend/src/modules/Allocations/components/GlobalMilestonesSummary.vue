<script setup>
const props = defineProps({
    milestones: { type: Array, default: () => [] }
})

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
