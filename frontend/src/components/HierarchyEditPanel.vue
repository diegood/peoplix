
<script setup>
import { computed } from 'vue'
import { Shield, Trash2, Plus, Network } from 'lucide-vue-next'

const props = defineProps({
    editingAllocationId: String,
    allNodes: { type: Array, default: () => [] },
    allocations: { type: Array, default: () => [] },
    activeSupervisorsFn: Function,
    getNameFn: Function,
    getDisplayNameFn: Function,
    hierarchyTypes: { type: Array, default: () => [] },
    showAddForm: Boolean,
    selectedTypeId: String,
    selectedSupervisorId: String
})

const emit = defineEmits([
    'update:showAddForm',
    'update:selectedTypeId',
    'update:selectedSupervisorId',
    'add',
    'remove'
])

const availableSupervisors = computed(() => {
    return props.allNodes.filter(a => a.id !== props.editingAllocationId)
})

const currentNode = computed(() => props.allocations.find(a => a.id === props.editingAllocationId))
const supervisors = computed(() => props.activeSupervisorsFn(currentNode.value))

const getName = (id) => props.getNameFn(id)
const getDisplayName = (collab) => props.getDisplayNameFn(collab)

</script>

<template>
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
                
                <div v-if="supervisors.length === 0" class="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">
                    Sin supervisores asignados.
                </div>

                <div v-for="h in supervisors" :key="h.id" 
                        class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-red-200 group transition">
                    <div class="flex items-center gap-3">
                        <span :class="['text-xs font-bold px-2 py-1 rounded border', h.hierarchyType?.color]">{{ h.hierarchyType?.name }}</span>
                        <span class="text-gray-700 font-medium">{{ getName(h.supervisor?.id) }}</span>
                    </div>
                    <button @click="emit('remove', h.id)" class="text-gray-300 group-hover:text-red-500 p-1 rounded hover:bg-red-50 transition">
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
                                    @click="emit('update:selectedTypeId', t.id)"
                                    :class="['flex-1 py-1.5 px-2 text-sm font-medium rounded-md border transition whitespace-nowrap', 
                                                selectedTypeId === t.id ? t.color + ' bg-opacity-100 shadow-sm ring-1 ring-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50']">
                                {{ t.name }}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase mb-1 block">Supervisor</label>
                        <select :value="selectedSupervisorId" @change="e => emit('update:selectedSupervisorId', e.target.value)" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="" disabled>Seleccionar...</option>
                            <option v-for="sup in availableSupervisors" :key="sup.id" :value="sup.id">
                                {{ getDisplayName(sup.collaborator) }}
                            </option>
                        </select>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button @click="emit('add')" :disabled="!selectedSupervisorId || !selectedTypeId" 
                                class="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                            Guardar
                        </button>
                        <button @click="emit('update:showAddForm', false)" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            <button v-else @click="emit('update:showAddForm', true)" class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2">
                <Plus size="18"/> Asignar Supervisor
            </button>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8 opacity-60">
            <Network size="64" class="mb-4 text-gray-200"/>
            <p class="text-lg font-medium">Selecciona un nodo</p>
            <p class="text-sm">para editar sus relaciones</p>
        </div>
    </div>
</template>
