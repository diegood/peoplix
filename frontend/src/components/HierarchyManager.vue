<script setup>
import { ref, computed } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { ADD_ALLOCATION_HIERARCHY, REMOVE_ALLOCATION_HIERARCHY } from '@/graphql/mutations'
import { Shield, Network, Trash2, Plus, X, List, GitGraph, Settings } from 'lucide-vue-next'
import HierarchyTreeNode from './HierarchyTreeNode.vue'
import HierarchyTypeManager from './HierarchyTypeManager.vue'
import RasciMatrix from '../modules/Rasci/components/RasciMatrix.vue'
import SimpleTabs from './SimpleTabs.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { GET_HIERARCHY_TYPES } from '../modules/Rasci/graphql/allocation'

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

const { mutate: addHierarchy } = useMutation(ADD_ALLOCATION_HIERARCHY, { 
    refetchQueries: ['GetProjects'] 
})
const { mutate: removeHierarchy } = useMutation(REMOVE_ALLOCATION_HIERARCHY, { 
    refetchQueries: ['GetProjects'] 
})

const allocations = computed(() => props.project?.allocations || [])

const availableSupervisors = computed(() => {
    return allocations.value.filter(a => a.id !== editingAllocationId.value)
})

const activeSupervisors = (allocation) => {
    return allocation.supervisors || []
}

const treeRoots = computed(() => {
    const roots = allocations.value.filter(a => !a.supervisors || a.supervisors.length === 0)
    return roots.sort((a,b) => {
        const nameA = getDisplayName(a.collaborator)
        const nameB = getDisplayName(b.collaborator)
        return nameA.localeCompare(nameB)
    })
})

const buildTreeFrom = (rootAlloc, visitedIds = new Set()) => {
    if (visitedIds.has(rootAlloc.id)) return null
    
    const newVisited = new Set(visitedIds)
    newVisited.add(rootAlloc.id)
    
    const children = (rootAlloc.subordinates || []).map(rel => {
        const fullSub = allocations.value.find(a => a.id === rel.subordinate.id) || rel.subordinate
        
        const subNode = buildTreeFrom(fullSub, newVisited)
        if (!subNode) return null
        
        return {
            ...subNode,
            relationName: rel.hierarchyType?.name || '?',
            relationColor: rel.hierarchyType?.color || 'bg-gray-100',
            uniqueKey: `${rootAlloc.id}-${rel.subordinate.id}-${rel.hierarchyType?.id}`
        }
    }).filter(Boolean)

    return {
        details: rootAlloc,
        children: children,
        uniqueKey: rootAlloc.id
    }
}

const treeData = computed(() => {
    return treeRoots.value.map(root => buildTreeFrom(root))
})

const startEdit = (allocation) => {
    editingAllocationId.value = allocation.id
    selectedSupervisorId.value = ''
    selectedTypeId.value = ''
    showAddForm.value = false
}

const selectFromTree = (allocation) => {
    startEdit(allocation)
}

const handleAdd = async () => {
    if (!selectedSupervisorId.value || !selectedTypeId.value) return
    
    try {
        await addHierarchy({
            subordinateAllocId: editingAllocationId.value,
            supervisorAllocId: selectedSupervisorId.value,
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
    const alloc = allocations.value.find(a => a.id === allocId)
    return getDisplayName(alloc?.collaborator)
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
                                <span v-for="role in alloc.roles" :key="role.id" class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                                    {{ role.name }}
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
