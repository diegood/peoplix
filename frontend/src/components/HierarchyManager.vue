<script setup>
import { ref, computed } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { ADD_ALLOCATION_HIERARCHY, REMOVE_ALLOCATION_HIERARCHY } from '@/graphql/mutations'
import { CREATE_ALLOCATION } from '../modules/Allocations/graphql/allocation.queries'
import { Shield, Network, Trash2, Plus, X, List, GitGraph, Settings } from 'lucide-vue-next'
import HierarchyTreeNode from './HierarchyTreeNode.vue'
import HierarchyTypeManager from './HierarchyTypeManager.vue'
import RasciMatrix from '../modules/Rasci/components/RasciMatrix.vue'
import SimpleTabs from './SimpleTabs.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { GET_HIERARCHY_TYPES } from '../modules/Rasci/graphql/allocation'
import { GET_ORG_HIERARCHY, GET_PROJECT_DETAILS } from '../modules/Configuration/graphql/hierarchy.queries'
import { dayjs } from '@/config'

const notificationStore = useNotificationStore()

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  isOpen: Boolean
})


const editingAllocationId = ref(null)
const selectedSupervisorId = ref('')
const selectedTypeId = ref('')
const showAddForm = ref(false)
const viewMode = ref('tree') // 'list' | 'tree'
const showTypeManager = ref(false)
const activeTab = ref('hierarchy')

const tabs = [
    { id: 'hierarchy', label: 'Arbol de relaciones' },
    { id: 'rasci', label: 'Matriz RASCI' }
]

const { result: typesResult } = useQuery(GET_HIERARCHY_TYPES)
const hierarchyTypes = computed(() => typesResult.value?.hierarchyTypes || [])

const { result: projectDetailsResult } = useQuery(GET_PROJECT_DETAILS, () => ({
    id: props.project.id
}), { 
    enabled: computed(() => !!props.project.id && props.isOpen),
    fetchPolicy: 'cache-and-network' 
})

const localProject = computed(() => {
    const proj = projectDetailsResult.value?.project || props.project
    console.log("HierarchyManager localProject:", JSON.stringify({ 
        source: projectDetailsResult.value ? 'query' : 'props', 
        id: proj?.id, 
        allocCount: proj?.allocations?.length,
        allocations: proj?.allocations
    }))
    return proj
})

const { result: orgHierarchyResult } = useQuery(GET_ORG_HIERARCHY, () => ({
    organizationId: localProject.value?.organization?.id || props.project.organizationId
}), { 
    enabled: computed(() => !!(localProject.value?.organization?.id || props.project.organizationId)),
    fetchPolicy: 'cache-and-network'
})

const orgHierarchy = computed(() => orgHierarchyResult.value?.orgHierarchy || [])

const { mutate: addHierarchy } = useMutation(ADD_ALLOCATION_HIERARCHY, { 
    refetchQueries: ['GetProjects', 'GetProjectDetails'] 
})
const { mutate: removeHierarchy } = useMutation(REMOVE_ALLOCATION_HIERARCHY, { 
    refetchQueries: ['GetProjects', 'GetProjectDetails'] 
})
const { mutate: createAllocation } = useMutation(CREATE_ALLOCATION, { 
    refetchQueries: ['GetProjects', 'GetProjectDetails'] 
})

const allocations = computed(() => {
    const list = localProject.value?.allocations || []
    console.log("HierarchyManager computed allocations:", list.map(a => ({ 
        id: a.id, 
        hasCollaborator: !!a.collaborator, 
        name: a.collaborator?.firstName 
    })))
    return list
})

const availableSupervisors = computed(() => {
    return allNodes.value.filter(a => a.id !== editingAllocationId.value)
})

const allNodes = computed(() => {
    const map = new Map()
    allocations.value.forEach(a => map.set(a.collaborator.id, { ...a, isVirtual: false }))

    const addParents = (collaboratorId) => {
        const relations = orgHierarchy.value.filter(h => h.subordinate.id === collaboratorId)
        
        relations.forEach(rel => {
            const supervisorId = rel.supervisor.id
            if (!map.has(supervisorId)) {
                map.set(supervisorId, {
                    id: `virtual-${supervisorId}`,
                    collaborator: rel.supervisor,
                    roles: rel.supervisor.roles || [],
                    supervisors: [],
                    subordinates: [],
                    isVirtual: true
                })
                addParents(supervisorId)
            }
        })
    }
    allocations.value.forEach(a => addParents(a.collaborator.id))
    
    return Array.from(map.values())
})

const getOrgSupervisors = (node) => {
    if (!node.collaborator) return []
    const orgRelations = orgHierarchy.value.filter(h => h.subordinate.id === node.collaborator.id)
    
    return orgRelations.map(h => {
        const supervisorNode = allNodes.value.find(n => n.collaborator.id === h.supervisor.id)
        if (!supervisorNode) return null
        return {
            id: 'org-' + h.id,
            isOrgLevel: true,
            hierarchyType: h.hierarchyType,
            supervisor: supervisorNode
        }
    }).filter(Boolean)
}

const activeSupervisors = (node) => {
    const projectSupervisors = node.supervisors || []
    const orgSupervisors = getOrgSupervisors(node)
    const uniqueOrg = orgSupervisors.filter(orgR => 
        !projectSupervisors.some(projR => projR.supervisor.id === orgR.supervisor.id) 
        && !projectSupervisors.some(projR => projR.supervisor.collaborator.id === orgR.supervisor.collaborator.id) 
    )
    
    return [...projectSupervisors, ...uniqueOrg]
}

const treeRoots = computed(() => {
    const roots = allNodes.value.filter(n => {
        const sups = activeSupervisors(n)
        return sups.length === 0
    })
    return roots.sort((a,b) => {
        const nameA = getDisplayName(a.collaborator)
        const nameB = getDisplayName(b.collaborator)
        return nameA.localeCompare(nameB)
    })
})

const buildTreeFrom = (rootNode, visitedIds = new Set()) => {
    if (visitedIds.has(rootNode.collaborator.id)) return null
    
    const newVisited = new Set(visitedIds)
    newVisited.add(rootNode.collaborator.id)
    
    const projectSubordinates = (rootNode.subordinates || []).map(rel => {
        const fullNode = allNodes.value.find(n => n.collaborator.id === rel.subordinate.collaborator?.id)
        if (!fullNode) return null

        return {
            ...rel,
            subordinate: fullNode,
            isOrgLevel: false
        }
    }).filter(Boolean)
    
    const orgSubRelations = orgHierarchy.value.filter(h => h.supervisor.id === rootNode.collaborator.id)
    
    const orgSubordinates = orgSubRelations.map(h => {
        const subNode = allNodes.value.find(n => n.collaborator.id === h.subordinate.id)
        if (!subNode) return null
        return {
            id: 'org-' + h.id,
            isOrgLevel: true,
            hierarchyType: h.hierarchyType,
            subordinate: subNode
        }
    }).filter(Boolean)

    const allRelations = [...projectSubordinates]
    orgSubordinates.forEach(orgRel => {
        const isDuplicate = allRelations.some(r => r.subordinate.collaborator.id === orgRel.subordinate.collaborator.id)
        if (!isDuplicate) {
            allRelations.push(orgRel)
        }
    })

    const children = allRelations.map(rel => {
        const subNodeTree = buildTreeFrom(rel.subordinate, newVisited)
        if (!subNodeTree) return null
        
        return {
            ...subNodeTree,
            relationName: rel.hierarchyType?.name || '?',
            relationColor: rel.hierarchyType?.color || 'bg-gray-100',
            uniqueKey: `${rootNode.id}-${rel.subordinate.id}-${rel.hierarchyType?.id}-${rel.isOrgLevel ? 'org' : 'proj'}`,
            isOrgLevel: rel.isOrgLevel
        }
    }).filter(Boolean)

    return {
        details: rootNode,
        children: children,
        uniqueKey: rootNode.id
    }
}

const treeData = computed(() => {
    return treeRoots.value.map(root => buildTreeFrom(root)).filter(Boolean)
})

const startEdit = (node) => {
    if (node.isVirtual) {
        notificationStore.showToast("No se puede editar una asignación virtual (sólo lectura desde Organización)", "info")
        return
    }
    editingAllocationId.value = node.id
    selectedSupervisorId.value = ''
    selectedTypeId.value = ''
    showAddForm.value = false
}

const selectFromTree = (nodeDetails) => {
    startEdit(nodeDetails)
}

const handleAdd = async () => {
    if (!selectedSupervisorId.value || !selectedTypeId.value) return
    
    let supervisorAllocId = selectedSupervisorId.value
    const supervisorNode = allNodes.value.find(n => n.id === selectedSupervisorId.value)
    
    try {
        if (supervisorNode?.isVirtual) {
            let role = supervisorNode.collaborator.roles?.find(r => r.isAdministrative)
            
            if (!role) role = supervisorNode.collaborator.roles?.[0]
            
            let roleId = role?.id

            if (!roleId && props.project.requiredRoles?.length > 0) {
                 roleId = props.project.requiredRoles[0].role?.id
            }

            if (!roleId) {
                notificationStore.showToast("El supervisor no tiene roles directos ni hay roles requeridos en el proyecto para asignarle.", "error")
                return
            }

            notificationStore.showToast("Asignando supervisor al proyecto...", "info")
            const currentWeek = dayjs().format('YYYY-[W]WW')
            
            const res = await createAllocation({
                projectId: props.project.id,
                collaboratorId: supervisorNode.collaborator.id,
                roleId: roleId,
                percentage: 0,
                startWeek: currentWeek
            })
            
            if (res?.data?.createAllocation?.id) {
                supervisorAllocId = res.data.createAllocation.id
            } else {
                throw new Error("Falló la auto-asignación")
            }
        }

        await addHierarchy({
            subordinateAllocId: editingAllocationId.value,
            supervisorAllocId: supervisorAllocId,
            typeId: selectedTypeId.value
        })
        showAddForm.value = false
        selectedSupervisorId.value = ''
        selectedTypeId.value = ''
    } catch (e) {
        notificationStore.showToast("Error al asignar supervisor: " + e.message, 'error')
    }
}

const handleRemove = async (hierarchyId) => {
    if (String(hierarchyId).startsWith('org-')) {
         notificationStore.showToast("No se puede eliminar una relación de Organización desde el Proyecto", "warning")
         return
    }

    if (!await notificationStore.showDialog("¿Eliminar esta relación?")) return
    try {
        await removeHierarchy({ hierarchyId })
    } catch (e) {
        notificationStore.showToast(e.message, 'error')
    }
}

const getDisplayName = (collab) => {
    if (!collab) return 'Desconocido'
    if (collab.firstName && collab.lastName) {
        return `${collab.firstName} ${collab.lastName}`
    }
    return collab.userName || collab.id
}

const getName = (allocId) => {
    const node = allNodes.value.find(a => a.id === allocId)
    return getDisplayName(node?.collaborator)
}

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
                <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Network class="text-blue-600"/>
                    Matriz de Responsabilidades
                </h2>
                <p class="text-sm text-gray-500">{{ project.name }}</p>
            </div>
            
            <div class="flex items-center gap-4">
                 <SimpleTabs :tabs="tabs" @change="(id) => activeTab = id" class="mr-4" />
                 
                 <div v-if="activeTab === 'hierarchy'" class="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
                     <button @click="viewMode = 'list'" :class="['p-2 rounded transition', viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600']" title="Lista">
                         <List size="20"/>
                     </button>
                     <button @click="viewMode = 'tree'" :class="['p-2 rounded transition', viewMode === 'tree' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600']" title="Árbol">
                         <GitGraph size="20"/>
                     </button>
                 </div>

                 <button v-if="activeTab === 'hierarchy'" @click="showTypeManager = true" class="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition flex items-center gap-2 text-sm font-bold">
                    <Settings size="16"/> Configurar Tipos
                 </button>
                 
                 <button @click="$emit('close')" class="p-2 hover:bg-gray-200 rounded-full transition">
                    <X size="20" class="text-gray-500" />
                </button>
            </div>
        </div>

        <div v-if="activeTab === 'hierarchy'" class="flex-1 overflow-hidden flex">
            <div class="flex-1 overflow-auto p-6 bg-gray-50/50 relative">
                
                <div v-if="viewMode === 'list'" class="space-y-3">
                    <div v-for="alloc in allocations" :key="alloc.id" 
                            @click="startEdit(alloc)"
                            :class="['p-4 rounded-xl border cursor-pointer transition flex items-center gap-4 bg-white hover:shadow-md', 
                                    editingAllocationId === alloc.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300']">
                        
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold border border-gray-100">
                                {{ getDisplayName(alloc.collaborator).substring(0,2).toUpperCase() }}
                        </div>

                        <div class="flex-1">
                            <div class="font-bold text-gray-800">{{ getDisplayName(alloc.collaborator) }}</div>
                            <div class="flex gap-2 mt-1 flex-wrap">
                                <span v-for="role in alloc.roles" :key="role.id" 
                                    :class="['text-xs px-2 py-0.5 rounded-md border', role.isAdministrative ? 'bg-purple-100 text-purple-700 border-purple-200 font-bold' : 'bg-gray-100 text-gray-600 border-gray-200']">
                                    {{ role.name }} <span v-if="role.isAdministrative" class="ml-1 text-[10px] uppercase">Admin</span>
                                </span>
                            </div>
                        </div>

                        <div v-if="activeSupervisors(alloc).length > 0" class="flex flex-col items-end gap-1">
                                <div v-for="sup in activeSupervisors(alloc)" :key="sup.id" :class="['text-[10px] font-bold px-1.5 py-0.5 rounded border', sup.hierarchyType?.color]">
                                    {{ sup.hierarchyType?.name }}
                                </div>
                        </div>
                    </div>
                </div>

                <div v-else class="min-h-full min-w-full flex justify-center p-8">
                     <div v-if="treeData.length === 0" class="text-gray-400 italic">No hay datos para mostrar el árbol.</div>
                     
                     <div class="flex gap-16 overflow-visible">
                         <div v-for="rootNode in treeData" :key="rootNode.uniqueKey" class="flex flex-col items-center">
                             <HierarchyTreeNode 
                                :node="rootNode" 
                                :depth="0"
                                @select="selectFromTree"
                             />
                         </div>
                     </div>
                </div>

            </div>

            <div class="w-96 bg-white border-l border-gray-200 p-6 shadow-xl z-20 overflow-y-auto flex flex-col">
                <div v-if="editingAllocationId">
                    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {{ getName(editingAllocationId).substring(0,2).toUpperCase() }}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg text-gray-900">{{ getName(editingAllocationId) }}</h3>
                            <p class="text-sm text-gray-500">Gestionar Supervisores</p>
                        </div>
                    </div>

                    <div class="space-y-4 mb-6">
                        <h4 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Shield size="16"/> Supervisores Asignados
                        </h4>
                        
                        <div v-if="activeSupervisors(allocations.find(a=>a.id===editingAllocationId)).length === 0" class="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">
                            Sin supervisores asignados.
                        </div>

                        <div v-for="h in activeSupervisors(allocations.find(a=>a.id===editingAllocationId))" :key="h.id" 
                                class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-red-200 group transition">
                            <div class="flex items-center gap-3">
                                <span :class="['text-xs font-bold px-2 py-1 rounded border', h.hierarchyType?.color]">{{ h.hierarchyType?.name }}</span>
                                <span class="text-gray-700 font-medium">{{ getName(h.supervisor?.id) }}</span>
                            </div>
                            <button @click="handleRemove(h.id)" class="text-gray-300 group-hover:text-red-500 p-1 rounded hover:bg-red-50 transition">
                                <Trash2 size="16"/>
                            </button>
                        </div>
                    </div>

                    <div v-if="showAddForm" class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                        <div class="grid grid-cols-1 gap-3">
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Relación</label>
                                <div class="flex flex-wrap gap-2">
                                    <button v-for="t in hierarchyTypes" :key="t.id" 
                                            @click="selectedTypeId = t.id"
                                            :class="['flex-1 py-1.5 px-2 text-sm font-medium rounded-md border transition whitespace-nowrap', 
                                                        selectedTypeId === t.id ? t.color + ' bg-opacity-100 shadow-sm ring-1 ring-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50']">
                                        {{ t.name }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="text-xs font-bold text-gray-500 uppercase mb-1 block">Supervisor</label>
                                <select v-model="selectedSupervisorId" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="" disabled>Seleccionar...</option>
                                    <option v-for="sup in availableSupervisors" :key="sup.id" :value="sup.id">
                                        {{ getDisplayName(sup.collaborator) }}
                                    </option>
                                </select>
                            </div>
                            <div class="flex gap-2 mt-2">
                                <button @click="handleAdd" :disabled="!selectedSupervisorId || !selectedTypeId" 
                                        class="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                                    Guardar
                                </button>
                                <button @click="showAddForm = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                    <button v-else @click="showAddForm = true" class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2">
                        <Plus size="18"/> Asignar Supervisor
                    </button>
                </div>

                <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8 opacity-60">
                    <Network size="64" class="mb-4 text-gray-200"/>
                    <p class="text-lg font-medium">Selecciona un nodo</p>
                    <p class="text-sm">para editar sus relaciones</p>
                </div>
            </div>
        </div>
        
        <div v-if="activeTab === 'rasci'" class="flex-1 overflow-hidden">
            <RasciMatrix :project="project" :allocations="allocations" />
        </div>
        
        <HierarchyTypeManager v-if="showTypeManager" @close="showTypeManager = false" />
    </div>
  </div>
</template>
