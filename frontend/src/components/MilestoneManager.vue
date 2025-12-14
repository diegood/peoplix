<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_MILESTONE_TYPES, GET_PROJECTS } from '@/graphql/queries'
import { CREATE_MILESTONE_TYPE, UPDATE_MILESTONE_TYPE, DELETE_MILESTONE_TYPE } from '@/graphql/mutations'
import { X, Plus, Trash2, Edit2, Hexagon, CheckCircle } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import BaseModal from '@/components/BaseModal.vue'

const notificationStore = useNotificationStore()

// Data
const { result: typesResult} = useQuery(GET_MILESTONE_TYPES)
const { result: projectsResult } = useQuery(GET_PROJECTS)
const { mutate: createType } = useMutation(CREATE_MILESTONE_TYPE, { refetchQueries: ['GetMilestoneTypes'] })
const { mutate: updateType } = useMutation(UPDATE_MILESTONE_TYPE, { refetchQueries: ['GetMilestoneTypes', 'GetProjects'] })
const { mutate: deleteType } = useMutation(DELETE_MILESTONE_TYPE, { refetchQueries: ['GetMilestoneTypes'] })

const milestoneTypes = computed(() => typesResult.value?.milestoneTypes || [])
const projects = computed(() => projectsResult.value?.projects || [])

// Stats aggregation
const typeUsage = computed(() => {
    const usage = {}
    projects.value.forEach(p => {
        p.milestones.forEach(m => {
            const tId = m.milestoneType?.id
            if (tId) {
                usage[tId] = (usage[tId] || 0) + 1
            }
        })
    })
    return usage
})

// State for editing
const newTypeForm = ref({ name: '', color: 'bg-indigo-400' })
const editingId = ref(null)
const editForm = ref({ name: '', color: '' })

// Actions
const handleCreate = async () => {
    if (!newTypeForm.value.name) return
    await createType(newTypeForm.value)
    newTypeForm.value.name = '' // Reset
}

const startEdit = (type) => {
    editingId.value = type.id
    editForm.value = { name: type.name, color: type.color }
}

const handleUpdate = async () => {
    if (!editForm.value.name) return
    await updateType({
        id: editingId.value,
        name: editForm.value.name,
        color: editForm.value.color
    })
    editingId.value = null
}

const handleDelete = async (id) => {
    if (typeUsage.value[id] > 0) {
        notificationStore.showToast("No se puede eliminar un tipo que está en uso.", 'error')
        return
    }
    if (await notificationStore.showDialog("¿Eliminar este tipo de hito?")) {
        try {
            await deleteType({ id })
        } catch (e) {
            notificationStore.showToast(e.message, 'error')
        }
    }
}

// Color Palette
const colors = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 
    'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400',
    'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400',
    'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400',
    'bg-rose-400', 'bg-gray-400'
]
</script>

<template>
    <BaseModal 
        :isOpen="true" 
        title="Gestión de Hitos" 
        maxWidth="max-w-2xl"
        @close="$emit('close')"
    >
        <template #title>
             <div class="flex items-center gap-2">
                <Hexagon class="text-indigo-600" />
                <div>
                     <span class="block text-xl font-bold text-gray-800">Gestión de Hitos</span>
                     <span class="block text-sm font-normal text-gray-500">Administra los tipos de eventos y visualiza estadísticas.</span>
                </div>
            </div>
        </template>

        <div class="space-y-8">
            <!-- SECTION: Statistics -->
            <div>
                <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Estadísticas Globales</h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                        <div class="text-3xl font-bold text-blue-600">{{ projects.reduce((acc, p) => acc + (p.milestones?.length || 0), 0) }}</div>
                        <div class="text-xs text-blue-500 font-medium mt-1">Hitos Totales</div>
                    </div>
                    <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                        <div class="text-3xl font-bold text-indigo-600">{{ projects.length }}</div>
                        <div class="text-xs text-indigo-500 font-medium mt-1">Proyectos Activos</div>
                    </div>
                </div>
            </div>

            <!-- SECTION: Types Management -->
            <div>
                <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Tipos de Hito</h3>
                
                <!-- New Type Form -->
                <div class="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div class="w-8 h-8 rounded-full shrink-0 shadow-sm border-2 border-white cursor-pointer relative group overflow-hidden">
                        <div :class="[newTypeForm.color, 'w-full h-full']"></div>
                        <select v-model="newTypeForm.color" class="absolute inset-0 opacity-0 cursor-pointer">
                            <option v-for="c in colors" :key="c" :value="c">{{ c }}</option>
                        </select>
                    </div>
                    <input v-model="newTypeForm.name" placeholder="Nuevo tipo (ej: Despliegue...)" 
                            class="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-gray-400" @keyup.enter="handleCreate"/>
                    <button @click="handleCreate" :disabled="!newTypeForm.name" 
                            class="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm">
                        <Plus size="18" />
                    </button>
                </div>

                <!-- List -->
                <div class="space-y-2">
                    <div v-for="type in milestoneTypes" :key="type.id" 
                            class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition group">
                        
                        <!-- Editing Mode -->
                        <template v-if="editingId === type.id">
                            <div class="flex items-center gap-3 flex-1">
                                <div class="w-8 h-8 rounded-full shrink-0 shadow-sm border-2 border-white cursor-pointer relative">
                                    <div :class="[editForm.color, 'w-full h-full']"></div>
                                    <select v-model="editForm.color" class="absolute inset-0 opacity-0 cursor-pointer">
                                        <option v-for="c in colors" :key="c" :value="c">{{ c }}</option>
                                    </select>
                                </div>
                                <input v-model="editForm.name" class="flex-1 border rounded px-2 py-1 text-sm" @keyup.enter="handleUpdate" />
                            </div>
                            <div class="flex gap-2 ml-4">
                                    <button @click="handleUpdate" class="text-green-600 hover:bg-green-100 p-1.5 rounded"><CheckCircle size="16"/></button>
                                    <button @click="editingId = null" class="text-gray-400 hover:bg-gray-200 p-1.5 rounded"><X size="16"/></button>
                            </div>
                        </template>
                        
                        <!-- View Mode -->
                        <template v-else>
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full shadow-sm" :class="type.color"></div>
                                <span class="font-medium text-gray-700">{{ type.name }}</span>
                                <span class="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full ml-2">
                                    {{ typeUsage[type.id] || 0 }} usos
                                </span>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button @click="startEdit(type)" class="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition">
                                    <Edit2 size="16" />
                                </button>
                                <button @click="handleDelete(type.id)" 
                                        class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                                        :disabled="typeUsage[type.id] > 0"
                                        :title="typeUsage[type.id] > 0 ? 'En uso' : 'Eliminar'">
                                    <Trash2 size="16" />
                                </button>
                            </div>
                        </template>
                    </div>
                    
                    <div v-if="milestoneTypes.length === 0" class="text-center py-8 text-gray-400 text-sm">
                        No hay tipos definidos.
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <button @click="$emit('close')" class="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm">
                Cerrar
            </button>
        </template>
    </BaseModal>
</template>
