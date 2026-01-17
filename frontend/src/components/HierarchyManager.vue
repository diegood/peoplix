<script setup>
import { ref, computed, toRef } from 'vue'
import { Network, List, GitGraph, Settings, X } from 'lucide-vue-next'
import HierarchyTypeManager from './HierarchyTypeManager.vue'
import HierarchyEditPanel from './HierarchyEditPanel.vue'
import RasciMatrix from '../modules/Rasci/components/RasciMatrix.vue'
import SimpleTabs from './SimpleTabs.vue'
import ProjectHierarchyTree from '../modules/Configuration/components/ProjectHierarchyTree.vue'

import { useHierarchyData } from '@/composables/hierarchy/useHierarchyData'
import { useHierarchyActions } from '@/composables/hierarchy/useHierarchyActions'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  isOpen: Boolean
})

defineEmits(['close'])

const viewMode = ref('tree') // 'list' | 'tree'
const showTypeManager = ref(false)
const activeTab = ref('hierarchy')

const showConnectionModal = ref(false)

const tabs = [
    { id: 'hierarchy', label: 'Arbol de relaciones' },
    { id: 'rasci', label: 'Matriz RASCI' }
]

const isOpenRef = toRef(props, 'isOpen')
const { 
    hierarchyTypes, 
    allocations, 
    allNodes, 
    activeSupervisors, 
    getDisplayName,
    getName,
    orgHierarchy
} = useHierarchyData(props, isOpenRef)

const {
    editingAllocationId,
    selectedSupervisorId,
    selectedTypeId,
    showAddForm,
    startEdit,
    handleAdd,
    handleRemove
} = useHierarchyActions(props, allNodes)

const treeHierarchy = computed(() => {
    const relations = []
    allocations.value.forEach(alloc => {
        alloc.supervisors?.forEach(sup => {
             relations.push({
                 id: sup.id,
                 supervisor: sup.supervisor.collaborator,
                 subordinate: alloc.collaborator,
                 hierarchyType: sup.hierarchyType
             })
        })
    })

    return [...relations, ...orgHierarchy.value.filter(h => 
        allNodes.value.some(n => n.collaborator.id === h.subordinate.id) && 
        allNodes.value.some(n => n.collaborator.id === h.supervisor.id)
    ).map(h => ({ ...h, isInherited: true }))]
})

const treeCollaborators = computed(() => {
    return allNodes.value.map(n => ({
        ...n.collaborator,
        isVirtual: n.isVirtual
    }))
})

const handleDeleteRelation = (relationId) => {
     handleRemove(relationId) 
}

const handleCreateRelation = (params) => {
    const { source, target } = params
    
    const subNode = allNodes.value.find(n => n.collaborator.id === target)
    const supNode = allNodes.value.find(n => n.collaborator.id === source)
    
    if (subNode && supNode) {
        editingAllocationId.value = subNode.id
        selectedSupervisorId.value = supNode.id
        selectedTypeId.value = '' 
        
        showConnectionModal.value = true
    }
}

const confirmConnection = async () => {
   if (!selectedTypeId.value) return 
   await handleAdd()
   showConnectionModal.value = false
}

const cancelConnection = () => {
    showConnectionModal.value = false
    selectedTypeId.value = ''
    selectedSupervisorId.value = ''
    editingAllocationId.value = null
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
                            @click="startEdit(allNodes.find(n => n.id === alloc.id))"
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

                        <div v-if="activeSupervisors(allNodes.find(n => n.id === alloc.id)).length > 0" class="flex flex-col items-end gap-1">
                                <div v-for="sup in activeSupervisors(allNodes.find(n => n.id === alloc.id))" :key="sup.id" :class="['text-[10px] font-bold px-1.5 py-0.5 rounded border', sup.hierarchyType?.color]">
                                    {{ sup.hierarchyType?.name }}
                                </div>
                        </div>
                    </div>
                </div>

                <div v-else class="h-full w-full flex justify-center p-4">
                     <ProjectHierarchyTree 
                        :hierarchy="treeHierarchy" 
                        :collaborators="treeCollaborators" 
                        @delete-relation="handleDeleteRelation" 
                        @create-relation="handleCreateRelation"
                     />
                </div>

            </div>

            <HierarchyEditPanel
                :editingAllocationId="editingAllocationId"
                :allNodes="allNodes"
                :allocations="allocations"
                :activeSupervisorsFn="activeSupervisors"
                :getNameFn="getName"
                :getDisplayNameFn="getDisplayName"
                :hierarchyTypes="hierarchyTypes"
                v-model:showAddForm="showAddForm"
                v-model:selectedTypeId="selectedTypeId"
                v-model:selectedSupervisorId="selectedSupervisorId"
                @add="handleAdd"
                @remove="handleRemove"
            />
        </div>
        
        <div v-if="activeTab === 'rasci'" class="flex-1 overflow-hidden">
            <RasciMatrix :project="project" :allocations="allocations" />
        </div>
        
        <HierarchyTypeManager v-if="showTypeManager" @close="showTypeManager = false" />
        
        <div v-if="showConnectionModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div class="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 class="font-bold text-gray-800 mb-4">Seleccionar Tipo de Relación</h3>
                <div class="mb-4">
                    <label class="block text-sm text-gray-600 mb-1">Tipo</label>
                    <select v-model="selectedTypeId" class="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                         <option value="" disabled>Seleccione un tipo...</option>
                         <option v-for="t in hierarchyTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2">
                    <button @click="cancelConnection" class="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded text-sm transition font-medium">Cancelar</button>
                    <button @click="confirmConnection" 
                        :disabled="!selectedTypeId"
                        class="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
