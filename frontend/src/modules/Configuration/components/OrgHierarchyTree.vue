<script setup>
import { ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import * as d3 from 'd3'
import { stringToColor } from '@/helper/Colors'
import HierarchyEdge from './HierarchyEdge.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const props = defineProps({
    hierarchy: {
        type: Array,
        required: true
    },
    collaborators: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['delete-relation'])

const nodes = ref([])
const edges = ref([])

const { fitView } = useVueFlow()

const getCollaborator = (id) => props.collaborators.find(c => c.id === id)

const onEdgeDelete = (hierarchyId) => {
    emit('delete-relation', hierarchyId)
}

const layoutGraph = () => {
    if (!props.hierarchy.length) {
        nodes.value = []
        edges.value = []
        return
    }

    const childrenMap = new Map()
    const allParticipants = new Set()
    const isSubordinate = new Set()

    props.hierarchy.forEach(h => {
        allParticipants.add(h.supervisor.id)
        allParticipants.add(h.subordinate.id)
        isSubordinate.add(h.subordinate.id)

        if (!childrenMap.has(h.supervisor.id)) {
            childrenMap.set(h.supervisor.id, [])
        }
        childrenMap.get(h.supervisor.id).push(h)
    })

    const rootIds = Array.from(allParticipants).filter(id => !isSubordinate.has(id))
    
    const buildD3Node = (collabId) => {
        const collab = getCollaborator(collabId) || { id: collabId, firstName: 'Unknown', lastName: '', roles: [] }
        const relations = childrenMap.get(collabId) || []
        
        const children = relations.map(r => buildD3Node(r.subordinate.id))

        const staticRoles = collab.roles?.filter(r => r.isAdministrative).map(r => r.name).join(', ') || ''
        
        return {
            name: `${collab.firstName} ${collab.lastName}`,
            id: collab.id,
            adminRoles: staticRoles,
            isVirtual: !getCollaborator(collabId),
            children: children.length ? children : null
        }
    }

    let hierarchyData = null
    if (rootIds.length > 1) {
        hierarchyData = {
            name: "Organización",
            id: 'root-virtual',
            isVirtual: true,
            children: rootIds.map(buildD3Node)
        }
    } else if (rootIds.length === 1) {
        hierarchyData = buildD3Node(rootIds[0])
    }

    if (!hierarchyData) return
    const root = d3.hierarchy(hierarchyData)
    
    const nodeWidth = 300
    const nodeHeight = 180
    const treeLayout = d3.tree().nodeSize([nodeWidth, nodeHeight])
    
    treeLayout(root)

    const newNodes = []
    const newEdges = []

    const findRelation = (sourceId, targetId) => {
        return props.hierarchy.find(h => h.supervisor.id === sourceId && h.subordinate.id === targetId)
    }

    root.descendants().forEach((d) => {
        newNodes.push({
            id: d.data.id,
            type: 'custom',
            position: { x: d.x, y: d.y }, 
            data: { 
                label: d.data.name,
                role: d.data.adminRoles,
                isVirtual: d.data.isVirtual
            },
        })

        if (d.parent) {
            const relation = findRelation(d.parent.data.id, d.data.id)
            const roleLabel = relation?.hierarchyType?.name || ''
            const roleColor = roleLabel ? stringToColor(roleLabel) : '#94a3b8'

            newEdges.push({
                id: `e-${d.parent.data.id}-${d.data.id}`,
                source: d.parent.data.id,
                target: d.data.id,
                type: 'hierarchy-edge',
                label: roleLabel, 
                data: { hierarchyId: relation?.id },
                labelStyle: { fill: 'white', fontWeight: 'bold', fontSize: '11px' },
                labelBgStyle: { fill: roleColor, rx: 4, ry: 4 },
                labelBgPadding: [6, 4],
                labelBgBorderRadius: 8,
                style: { stroke: roleColor, strokeWidth: 2 },
            })
        }
    })

    nodes.value = newNodes
    edges.value = newEdges

    setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 })
    }, 100)
}

watch(() => [props.hierarchy, props.collaborators], layoutGraph, { deep: true, immediate: true })

const onPaneReady = (instance) => {
    instance.fitView({ padding: 0.2 })
}
</script>

<template>
    <div class="h-[600px] w-full bg-gray-50 border rounded-lg overflow-hidden shadow-inner relative">
        <VueFlow
            v-model:nodes="nodes" 
            v-model:edges="edges"
            :default-viewport="{ zoom: 1 }"
            :min-zoom="0.1"
            :max-zoom="4"
            @pane-ready="onPaneReady"
        >
            <Background pattern-color="#cbd5e1" :gap="20" />
            <Controls />

            <template #edge-hierarchy-edge="edgeProps">
                <HierarchyEdge v-bind="edgeProps" @delete="onEdgeDelete" />
            </template>

            <template #node-custom="{ data }">
                <div 
                    class="px-4 py-3 rounded-xl border transition-all duration-300 min-w-[200px] max-w-[250px] flex flex-col justify-center relative cursor-default group hover:-translate-y-1 hover:shadow-lg"
                    :class="[
                        data.isVirtual 
                            ? 'bg-gray-50 border-dashed border-gray-300 opacity-70' 
                            : 'bg-white border-gray-200 shadow-sm border-l-4 border-l-blue-500'
                    ]"
                >
                    <div class="text-sm font-bold text-gray-800 truncate pr-2">
                        {{ data.label }}
                    </div>
                </div>
            </template>
        </VueFlow>
    </div>
</template>
