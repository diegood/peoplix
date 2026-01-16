<script setup>
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ORG_HIERARCHY, ADD_ORG_HIERARCHY, REMOVE_ORG_HIERARCHY, GET_COLLABORATORS_WITH_ROLES } from '../graphql/hierarchy.queries'
import { GET_HIERARCHY_TYPES } from '@/graphql/queries'
import { useNotificationStore } from '@/stores/notificationStore'
import { Trash2, Network, Plus } from 'lucide-vue-next'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import * as d3 from 'd3'

const props = defineProps({
    organizationId: {
        type: String,
        required: true
    }
})

const notificationStore = useNotificationStore()
const svgRef = ref(null)

const { result: hierarchyResult, refetch: refetchHierarchy } = useQuery(GET_ORG_HIERARCHY, () => ({
    organizationId: props.organizationId
}))

const { result: collabResult } = useQuery(GET_COLLABORATORS_WITH_ROLES)
const { result: typesResult } = useQuery(GET_HIERARCHY_TYPES)

const { mutate: addHierarchy } = useMutation(ADD_ORG_HIERARCHY)
const { mutate: removeHierarchy } = useMutation(REMOVE_ORG_HIERARCHY)

const hierarchy = computed(() => hierarchyResult.value?.orgHierarchy || [])
const collaborators = computed(() => collabResult.value?.collaborators || [])
const hierarchyTypes = computed(() => typesResult.value?.hierarchyTypes || [])

const adminCollaborators = computed(() => {
    return collaborators.value.filter(c => c.roles.some(r => r.isAdministrative))
})

const supervisorOption = ref(null)
const subordinateOption = ref(null)
const newType = ref('')

const buildTreeData = () => {
    if (hierarchy.value.length === 0) return null

    // 1. Identify all participants and relationships
    const childrenMap = new Map()
    const allParticipants = new Set()
    const isSubordinate = new Set()

    hierarchy.value.forEach(h => {
        allParticipants.add(h.supervisor.id)
        allParticipants.add(h.subordinate.id)
        isSubordinate.add(h.subordinate.id)

        if (!childrenMap.has(h.supervisor.id)) {
            childrenMap.set(h.supervisor.id, [])
        }
        childrenMap.get(h.supervisor.id).push(h)
    })

    // 2. Identify Roots (Participants who are not subordinates)
    const rootIds = Array.from(allParticipants).filter(id => !isSubordinate.has(id))
    
    // 3. Resolve full objects
    const roots = rootIds.map(id => collaborators.value.find(c => c.id === id) || { id, firstName: 'Unknown', lastName: '', roles: [] })

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
            adminRoles: roleNames
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

watch([hierarchy, collaborators], () => {
    setTimeout(renderTree, 100)
    if(!svgRef.value) { setTimeout(renderTree, 500) }
})

const handleAdd = async () => {
    if (!supervisorOption.value || !subordinateOption.value || !newType.value) return
    if (supervisorOption.value.id === subordinateOption.value.id) {
        notificationStore.showToast("No puede ser su propio supervisor", "error")
        return
    }
    
    try {
        await addHierarchy({
            supervisorId: supervisorOption.value.id,
            subordinateId: subordinateOption.value.id,
            hierarchyTypeId: newType.value
        })
        subordinateOption.value = null
        await refetchHierarchy()
        notificationStore.showToast("Relación agregada", "success")
    } catch (e) {
        notificationStore.showToast("Error agregando relación: " + e.message, "error")
    }
}

const handleDelete = async (item) => {
    if(await notificationStore.showDialog("¿Eliminar esta relación?")) {
        try {
            await removeHierarchy({ id: item.id })
            await refetchHierarchy()
            notificationStore.showToast("Relación eliminada", "success")
        } catch (e) {
             notificationStore.showToast("Error: " + e.message, "error")
        }
    }
}

const customLabel = (collab) => {
    const roles = collab.roles.filter(r => r.isAdministrative).map(r => r.name).join(', ')
    return `${collab.firstName} ${collab.lastName} (${roles})`
}

</script>

<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Network class="text-blue-600"/> Arbol Administrativo (Organización)
        </h3>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h4 class="text-sm font-bold text-gray-700 mb-2">Nueva Relación</h4>
            <div class="flex flex-wrap gap-4 items-end">
                <div class="flex-1 min-w-[250px]">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
                    <VueMultiselect
                        v-model="supervisorOption"
                        :options="collaborators"
                        :custom-label="customLabel"
                        placeholder="Buscar colaborador..."
                        select-label="Seleccionar"
                        selected-label="Seleccionado"
                        deselect-label="Quitar"
                        track-by="id"
                    >
                        <template #noResult>No se encontraron resultados</template>
                    </VueMultiselect>
                </div>
                <div class="flex-1 min-w-[250px]">
                     <label class="block text-xs font-medium text-gray-500 mb-1">Subordinado</label>
                     <VueMultiselect
                        v-model="subordinateOption"
                        :options="collaborators"
                        :custom-label="customLabel"
                        placeholder="Buscar colaborador..."
                        select-label="Seleccionar"
                        selected-label="Seleccionado"
                        deselect-label="Quitar"
                        track-by="id"
                    >
                         <template #noResult>No se encontraron resultados</template>
                    </VueMultiselect>
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Tipo de Relación</label>
                    <select v-model="newType" class="w-full border rounded px-3 py-2 text-sm h-[40px] bg-white">
                        <option value="">Seleccionar...</option>
                        <option v-for="t in hierarchyTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                </div>
                <button @click="handleAdd" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm font-medium h-[40px]">
                    <Plus size="16"/> Agregar
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 border-r pr-6 space-y-2">
                <h4 class="text-sm font-bold text-gray-500 uppercase mb-2">Lista de Relaciones</h4>
                <div v-if="hierarchy.length === 0" class="text-gray-400 text-sm italic">No hay relaciones definidas</div>
                <div v-for="h in hierarchy" :key="h.id" class="flex items-center justify-between p-2 border rounded bg-white hover:bg-gray-50 text-sm">
                    <div>
                        <div class="font-medium text-gray-800">{{ h.supervisor.firstName }} {{ h.supervisor.lastName }}</div>
                        <div class="text-xs text-gray-500">&darr; {{ h.hierarchyType.name }} &darr;</div>
                        <div class="font-medium text-gray-800">{{ h.subordinate.firstName }} {{ h.subordinate.lastName }}</div>
                    </div>
                    <button @click="handleDelete(h)" class="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size="16" />
                    </button>
                </div>
            </div>

            <div class="lg:col-span-2 overflow-auto bg-gray-50 rounded border min-h-[400px] flex items-center justify-center relative">
                 <h4 class="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase">Visualización Arbol</h4>
                 <svg ref="svgRef"></svg>
            </div>
        </div>
    </div>
</template>
