<script>
export default {
    inheritAttrs: false
}
</script>

<script setup>
import { computed } from 'vue'
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@vue-flow/core'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps({
  id: { type: String, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  sourcePosition: { type: String, required: true },
  targetPosition: { type: String, required: true },
  data: { type: Object, required: false },
  markerEnd: { type: String, required: false },
  style: { type: Object, required: false },
  label: { type: String, required: false },
  labelStyle: { type: Object, required: false },
  labelBgStyle: { type: Object, required: false },
  labelBgPadding: { type: Array, required: false },
  labelBgBorderRadius: { type: Number, required: false },
})

const emit = defineEmits(['delete'])

const path = computed(() => getSmoothStepPath(props))

const onDelete = (evt) => {
    evt.stopPropagation()
    if (props.data?.hierarchyId) {
        emit('delete', props.data.hierarchyId)
    }
}
</script>

<template>
  <BaseEdge :path="path[0]" :style="style" :marker-end="markerEnd" />
  
  <EdgeLabelRenderer>
    <div
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
        zIndex: 10,
      }"
      class="group flex items-center gap-1"
    >
        <div 
             :style="{ 
                backgroundColor: labelBgStyle?.fill, 
                color: labelStyle?.fill,
                borderRadius: labelBgBorderRadius + 'px',
                padding: (labelBgPadding?.[0] || 2) + 'px ' + (labelBgPadding?.[1] || 4) + 'px'
             }"
             class="shadow-sm font-bold text-[10px] whitespace-nowrap flex items-center gap-2 border border-white/20"
        >
            {{ label }}
            
            <button v-if="data?.hierarchyId && !data?.isInherited" class="bg-white/20 hover:bg-white/40 text-inherit rounded p-0.5 transition-colors" title="Eliminar relación" @click="onDelete">
                <Trash2 :size="10" />
            </button>
        </div>
    </div>
  </EdgeLabelRenderer>
</template>
