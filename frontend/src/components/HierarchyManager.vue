```
<script setup>
import { ref, toRef } from 'vue'
import { Network, List, GitGraph, Settings, X } from 'lucide-vue-next'
import HierarchyTreeNode from './HierarchyTreeNode.vue'
import HierarchyTypeManager from './HierarchyTypeManager.vue'
import HierarchyEditPanel from './HierarchyEditPanel.vue'
import RasciMatrix from '../modules/Rasci/components/RasciMatrix.vue'
import SimpleTabs from './SimpleTabs.vue'

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

const tabs = [
    { id: 'hierarchy', label: 'Arbol de relaciones' },
    { id: 'rasci', label: 'Matriz RASCI' }
]

// Composables
const { 
    hierarchyTypes, 
    allocations, 
    allNodes, 
    activeSupervisors, 
    treeData, 
    getDisplayName,
    getName
} = useHierarchyData(props, toRef(props, 'isOpen'))

const {
    editingAllocationId,
    selectedSupervisorId,
    selectedTypeId,
    showAddForm,
    startEdit,
    handleAdd,
    handleRemove
} = useHierarchyActions(props, allNodes, getDisplayName)

const selectFromTree = (nodeDetails) => {
    startEdit(nodeDetails)
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
    </div>
  </div>
</template>
