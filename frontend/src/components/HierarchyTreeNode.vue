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

const emit = defineEmits(['select'])

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
</script>

<template>
  <div class="flex flex-col items-center relative">
    <!-- Node Card -->
    <!-- The node itself needs z-index to sit on top of lines -->
    <div @click="$emit('select', node.details)" 
         class="relative z-10 bg-white p-3 rounded-xl border shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3 min-w-[200px] transition-all group my-4"
         :class="[node.details.id === node.selectedId ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200']">
        
        <!-- Connection Badge (Relationship Type) - Sits on the line coming from top -->
        <div v-if="node.relationName" 
             class="absolute -top-[26px] left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-20 whitespace-nowrap bg-white"
             :class="node.relationColor">
            {{ node.relationName }}
        </div>

        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-100 flex items-center justify-center font-bold text-gray-500 shrink-0">
            {{ (node.details.collaborator.firstName[0] + node.details.collaborator.lastName[0]).toUpperCase() }}
        </div>
        
        <div class="flex-1 min-w-0">
            <div class="font-bold text-gray-800 text-sm truncate">{{ node.details.collaborator.firstName }} {{ node.details.collaborator.lastName }}</div>
            <div class="flex flex-wrap gap-1 mt-1">
                 <span v-for="role in node.details.roles" :key="role.id" class="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">
                    {{ role.name }}
                 </span>
            </div>
        </div>
    </div>

    <!-- Children Container -->
    <!-- We use a flex row for children -->
    <div v-if="hasChildren" class="flex items-start justify-center gap-4 pt-4 relative">
        <!-- Connector Lines Logic:
             We draw a line up from each child.
             We draw a horizontal line across children (except first/last halves).
             We draw a line down from parent (already done by padding/margin or pseudo element).
        -->
        
        <!-- The line DOWN from parent to the horizontal bar -->
        <div class="absolute top-0 left-1/2 w-px h-4 bg-gray-300 -ml-px"></div>

        <div v-for="(child, index) in node.children" :key="child.uniqueKey" class="flex flex-col items-center relative px-2">
            
            <!-- Horizontal Line (The Crossbar) -->
            <!-- Covers the top of the child area. -->
            <!-- If first child, line starts at 50% (goes right) -->
            <!-- If last child, line ends at 50% (coming from left) -->
            <!-- If middle, line is 100% width -->
            <!-- If only one child, no horizontal line needed! -->
            
            <div v-if="node.children.length > 1" class="absolute top-0 h-px bg-gray-300 w-full"
                 :class="{
                     'left-1/2 w-1/2': index === 0,
                     'right-1/2 w-1/2': index === node.children.length - 1 && index !== 0,
                     'left-0 w-full': index > 0 && index < node.children.length - 1
                 }">
            </div>

            <!-- Vertical Line UP from child to the Crossbar -->
            <div class="w-px h-4 bg-gray-300 mb-0"></div>

            <!-- Recursive Child Node -->
            <HierarchyTreeNode 
                :node="{ ...child, selectedId: node.selectedId }" 
                :depth="depth + 1"
                @select="$emit('select', $event)"
            />
        </div>
    </div>
  </div>
</template>
