<script setup>
import { computed, ref, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_COLLABORATORS } from '@/graphql/queries'
import BaseModal from '@/components/BaseModal.vue'
import { Search, User, Check, Users } from 'lucide-vue-next'

const props = defineProps({
    isOpen: Boolean,
    taskId: String,
    roleId: String,
    currentCollaboratorId: String,
    projectAllocations: {
        type: Array,
        default: () => []
    },
    roleName: String // For display
})

const emit = defineEmits(['close', 'select'])

const showAll = ref(false)
const searchQuery = ref('')
const selectedId = ref(props.currentCollaboratorId)

// Global query (lazy loaded or just filtered active)
const { result: globalResult, loading: globalLoading } = useQuery(GET_COLLABORATORS, null, () => ({
    enabled: showAll.value
}))

const globalCollaborators = computed(() => globalResult.value?.collaborators || [])

// Filter Logic
const filteredList = computed(() => {
    let list = []
    
    if (showAll.value) {
        list = globalCollaborators.value
    } else {
        // Filter from project allocations
        // Must match roleId
        const unique = new Map()
        props.projectAllocations.forEach(a => {
            if (a.collaborator) {
                // strict filter: user must be assigned to THIS role in the project?
                // User said: "los colaboradores... con ese rol asignado"
                // Check if allocation has this role
                const hasRole = a.roles?.some(r => r.id === props.roleId)
                if (hasRole && !unique.has(a.collaborator.id)) {
                     unique.set(a.collaborator.id, a.collaborator)
                }
            }
        })
        list = Array.from(unique.values())
    }

    // Apply Search
    if (searchQuery.value) {
        const lower = searchQuery.value.toLowerCase()
        list = list.filter(c => 
            c.firstName.toLowerCase().includes(lower) || 
            c.lastName.toLowerCase().includes(lower) || 
            c.userName?.toLowerCase().includes(lower)
        )
    }
    
    return list
})

const handleSelect = (collab) => {
    selectedId.value = collab.id
    emit('select', collab)
}

const handleClear = () => {
    selectedId.value = null
    emit('select', null)
}

</script>

<template>
    <BaseModal 
        :isOpen="isOpen" 
        :title="`Asignar: ${roleName || 'Colaborador'}`"
        maxWidth="max-w-md"
        @close="$emit('close')"
    >
        <template #title>
             <div class="flex items-center gap-2">
                <Users class="text-blue-600" />
                <div>
                     <span class="block text-lg font-bold text-gray-800">Asignar Colaborador</span>
                     <span class="block text-xs font-normal text-gray-500">Rol: {{ roleName }}</span>
                </div>
            </div>
        </template>

        <div class="space-y-4">
             <!-- Search & Toggle -->
             <div class="flex flex-col gap-2">
                 <div class="relative">
                     <Search class="absolute left-3 top-2.5 text-gray-400" :size="16" />
                     <input 
                        v-model="searchQuery" 
                        placeholder="Buscar..." 
                        class="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" 
                     />
                 </div>
                 
                 <div class="flex items-center gap-2">
                     <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                         <input type="checkbox" v-model="showAll" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                         Mostrar todos (incluir no asignados al rol/proyecto)
                     </label>
                 </div>
             </div>

             <!-- List -->
             <div class="h-64 overflow-y-auto border rounded-lg divide-y bg-white">
                 <div v-if="filteredList.length === 0" class="p-4 text-center text-gray-400 text-sm">
                     {{ showAll ? (globalLoading ? 'Cargando...' : 'No se encontraron colaboradores.') : 'No hay colaboradores asignados a este rol en el proyecto.' }}
                 </div>

                 <button 
                    v-for="collab in filteredList" 
                    :key="collab.id"
                    @click="handleSelect(collab)"
                    class="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors group text-left"
                    :class="{'bg-blue-50/50': selectedId === collab.id}"
                 >
                    <div class="flex items-center gap-3">
                        <img v-if="collab.avatar" :src="collab.avatar" class="w-8 h-8 rounded-full object-cover" />
                        <div v-else class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs group-hover:bg-white group-hover:text-blue-600 transition-colors">
                            {{ collab.firstName[0] }}{{ collab.lastName[0] }}
                        </div>
                        <div>
                            <div class="font-medium text-sm text-gray-800">{{ collab.firstName }} {{ collab.lastName }}</div>
                            <div class="text-xs text-gray-400">{{ collab.userName }}</div>
                        </div>
                    </div>
                    <div v-if="selectedId === collab.id" class="text-blue-600">
                        <Check :size="18" />
                    </div>
                 </button>
             </div>
             
             <div class="flex justify-between items-center pt-2">
                 <button @click="handleClear" class="text-sm text-red-500 hover:text-red-700 font-medium">
                     Desasignar
                 </button>
                 <button @click="$emit('close')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
                     Cancelar
                 </button>
             </div>
        </div>
    </BaseModal>
</template>
