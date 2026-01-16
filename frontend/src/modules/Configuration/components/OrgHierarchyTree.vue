<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

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

const svgRef = ref(null)

const buildTreeData = () => {
    if (props.hierarchy.length === 0) return null

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
    
    const roots = rootIds.map(id => props.collaborators.find(c => c.id === id) || { id, firstName: 'Unknown', lastName: '', roles: [] })

    const buildNode = (collab) => {
        const relations = childrenMap.get(collab.id) || []
        const children = relations.map(r => ({
            ...buildNode(r.subordinate),
            hierarchyId: r.id,
            type: r.hierarchyType
        }))
        
        const roleNames = collab.roles?.filter(r => r.isAdministrative).map(r => r.name).join(', ') || ''

        return {
            name: `${collab.firstName} ${collab.lastName}`,
            id: collab.id,
            children: children.length ? children : null,
            adminRoles: roleNames,
            isVirtual: !props.collaborators.some(c => c.id === collab.id)
        }
    }

    if (roots.length > 1) {
         return {
            name: "Organización",
            children: roots.map(buildNode),
            isVirtual: true
        }
    } else if (roots.length === 1) {
        return buildNode(roots[0])
    }
    return null
}

const renderTree = () => {
    if (!svgRef.value) return
    const data = buildTreeData()
    if (!data) {
        d3.select(svgRef.value).selectAll('*').remove()
        return
    }

    const width = 800
    const height = 600
    const margin = { top: 20, right: 90, bottom: 30, left: 90 }

    const svg = d3.select(svgRef.value)
    svg.selectAll('*').remove()
    
    const g = svg.attr('width', width)
       .attr('height', height)
       .append('g')
       .attr('transform', `translate(${margin.left},${margin.top})`)

    const tree = d3.tree().size([height - margin.top - margin.bottom, width - margin.left - margin.right])
    const root = d3.hierarchy(data)
    
    tree(root)

    g.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))

    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`)

    nodes.append('circle')
        .attr('r', 6)
        .attr('fill', d => d.data.isVirtual ? '#ccc' : '#fff')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 3)

    nodes.append('text')
        .attr('dy', 3)
        .attr('x', d => d.children ? -8 : 8)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('font-size', '12px')
        
    nodes.append('text')
        .attr('dy', 18)
        .attr('x', d => d.children ? -8 : 8)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.adminRoles)
        .style('font-size', '10px')
        .style('fill', '#666')
}

watch(() => [props.hierarchy, props.collaborators], () => {
    setTimeout(renderTree, 100)
    if(!svgRef.value) { setTimeout(renderTree, 500) }
}, { deep: true })

onMounted(() => {
    setTimeout(renderTree, 100)
})
</script>

<template>
    <div class="overflow-auto bg-gray-50 rounded border min-h-[400px] flex items-center justify-center relative">
         <h4 class="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase">Visualización Arbol</h4>
         <svg ref="svgRef"></svg>
    </div>
</template>
