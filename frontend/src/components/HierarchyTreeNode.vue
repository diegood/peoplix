<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
})

defineEmits(['select'])

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
</script>

<template>
  <div class="flex flex-col items-center relative">
    <div @click="$emit('select', node.details)" 
         class="relative z-10 bg-white p-3 rounded-xl border shadow-sm hover:shadow-md cursor-pointer flex flex-row items-center gap-3 min-w-[220px] max-w-[260px] transition-all group my-4 text-left"
         :class="[node.details.id === node.selectedId ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200']">
        
        <div v-if="node.relationName" 
             class="absolute -top-[10px] left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-20 whitespace-nowrap bg-white"
             :class="node.relationColor">
            {{ node.relationName }}
        </div>

        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-100 flex items-center justify-center font-bold text-gray-500 shrink-0 text-xs">
            {{ ((node.details.collaborator?.firstName?.[0] || '') + (node.details.collaborator?.lastName?.[0] || '')).toUpperCase() || '??' }}
        </div>
        
        <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="font-bold text-gray-800 text-sm truncate leading-tight">
                {{ node.details.collaborator?.firstName }} {{ node.details.collaborator?.lastName }}
            </div>
            
            <div class="flex flex-wrap gap-1 mt-1">
                 <span v-for="role in node.details.roles || []" :key="role.id" 
                    :class="['text-[10px] px-1.5 py-0.5 rounded border border-gray-100 items-center flex', role.isAdministrative ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium' : 'bg-gray-50 text-gray-500']">
                    {{ role.name }} <span v-if="role.isAdministrative" class="ml-1 text-[8px] bg-purple-200 px-0.5 rounded text-purple-800">ORG</span>
                 </span>
            </div>
        </div>
    </div>

    <div v-if="hasChildren" class="flex items-start justify-center gap-4 pt-4 relative">
        
        <div class="absolute top-0 left-1/2 w-px h-4 bg-gray-300 -ml-px"></div>

        <div v-for="(child, index) in node.children" :key="child.uniqueKey" class="flex flex-col items-center relative px-2">
            <div v-if="node.children.length > 1" class="absolute top-0 h-px bg-gray-300 w-full"
                 :class="{
                     'left-1/2 w-1/2': index === 0,
                     'right-1/2 w-1/2': index === node.children.length - 1 && index !== 0,
                     'left-0 w-full': index > 0 && index < node.children.length - 1
                 }">
            </div>

            <div class="w-px h-4 bg-gray-300 mb-0"></div>

            <HierarchyTreeNode 
                :node="{ ...child, selectedId: node.selectedId }" 
                :depth="depth + 1"
                @select="$emit('select', $event)"
            />
        </div>
    </div>
  </div>
</template>
