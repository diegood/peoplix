<script setup>
import { ref, computed } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from 'graphql-tag'
import { X, Plus, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-vue-next'

const GET_HIERARCHY_TYPES = gql`
  query GetHierarchyTypes {
    hierarchyTypes {
      id
      name
      color
      rank
    }
  }
`

const CREATE_TYPE = gql`
  mutation CreateHierarchyType($name: String!, $color: String!, $rank: Int) {
    createHierarchyType(name: $name, color: $color, rank: $rank) {
      id
    }
  }
`

const UPDATE_TYPE = gql`
  mutation UpdateHierarchyType($id: ID!, $name: String, $color: String, $rank: Int) {
    updateHierarchyType(id: $id, name: $name, color: $color, rank: $rank) {
      id
    }
  }
`

const DELETE_TYPE = gql`
  mutation DeleteHierarchyType($id: ID!) {
    deleteHierarchyType(id: $id)
  }
`

const emit = defineEmits(['close'])

const { result, loading, refetch } = useQuery(GET_HIERARCHY_TYPES)
const { mutate: createType } = useMutation(CREATE_TYPE, { refetchQueries: ['GetHierarchyTypes', 'GetProjects'] })
const { mutate: updateType } = useMutation(UPDATE_TYPE, { refetchQueries: ['GetHierarchyTypes', 'GetProjects'] })
const { mutate: deleteType } = useMutation(DELETE_TYPE, { refetchQueries: ['GetHierarchyTypes', 'GetProjects'] })

const types = computed(() => result.value?.hierarchyTypes || [])

const editingId = ref(null)
const form = ref({
    name: '',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    rank: 0
})

const startEdit = (t) => {
    editingId.value = t.id
    form.value = { name: t.name, color: t.color, rank: t.rank }
}

const cancelEdit = () => {
    editingId.value = null
    form.value = { name: '', color: 'bg-gray-100 text-gray-700 border-gray-200', rank: 0 }
}

const handleSave = async () => {
    try {
        if (editingId.value) {
            await updateType({ id: editingId.value, ...form.value })
        } else {
            await createType(form.value)
        }
        cancelEdit()
    } catch (e) {
        alert("Error: " + e.message)
    }
}

const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este tipo de jerarquía?")) return
    try {
        await deleteType({ id })
    } catch (e) {
        alert("No se puede eliminar: " + e.message)
    }
}

const predefinedColors = [
    { label: 'Azul', value: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Morado', value: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Naranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
    { label: 'Verde', value: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'Rojo', value: 'bg-red-100 text-red-700 border-red-200' },
    { label: 'Gris', value: 'bg-gray-100 text-gray-700 border-gray-200' },
    { label: 'Amarillo', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

</script>

<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-bold text-gray-800">Tipos de Jerarquía</h2>
            <button @click="$emit('close')" class="p-2 hover:bg-gray-200 rounded-full transition">
                <X size="20" class="text-gray-500" />
            </button>
        </div>
        
        <div class="p-6 overflow-auto flex-1">
            <div class="space-y-4">
                <div v-for="t in types" :key="t.id" class="flex items-center gap-3 p-3 border rounded-lg bg-white" :class="editingId === t.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'">
                    <div v-if="editingId === t.id" class="flex-1 space-y-2">
                        <input v-model="form.name" class="w-full border rounded px-2 py-1 text-sm font-bold" placeholder="Nombre (ej: TL)" />
                        <div class="flex flex-wrap gap-2">
                            <div v-for="c in predefinedColors" :key="c.label" 
                                 @click="form.color = c.value"
                                 class="w-6 h-6 rounded-full cursor-pointer border-2"
                                 :class="[c.value.split(' ')[0], form.color === c.value ? 'border-black' : 'border-transparent']"
                                 :title="c.label">
                            </div>
                        </div>
                         <input v-model.number="form.rank" type="number" class="w-20 border rounded px-2 py-1 text-xs" placeholder="Rango" />
                    </div>
                    
                    <div v-else class="flex-1 flex items-center gap-3">
                         <span :class="['px-2 py-1 rounded text-sm font-bold border', t.color]">
                             {{ t.name }}
                         </span>
                         <span class="text-xs text-gray-400">Rango: {{ t.rank }}</span>
                    </div>

                    <div class="flex items-center gap-1">
                        <template v-if="editingId === t.id">
                            <button @click="handleSave" class="text-green-600 p-1 hover:bg-green-50 rounded"><Plus size="16"/></button>
                            <button @click="cancelEdit" class="text-gray-400 p-1 hover:bg-gray-100 rounded"><X size="16"/></button>
                        </template>
                        <template v-else>
                            <button @click="startEdit(t)" class="text-blue-500 p-1 hover:bg-blue-50 rounded"><Edit2 size="16"/></button>
                            <button @click="handleDelete(t.id)" class="text-red-400 p-1 hover:bg-red-50 rounded"><Trash2 size="16"/></button>
                        </template>
                    </div>
                </div>

                <!-- Add New -->
                <div v-if="!editingId" class="border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-blue-300 transition">
                     <div class="space-y-2">
                        <div class="flex gap-2">
                            <input v-model="form.name" class="flex-1 border rounded px-3 py-2 text-sm" placeholder="Nuevo Tipo (ej: PM)" />
                            <input v-model.number="form.rank" type="number" class="w-20 border rounded px-2 py-1 text-sm" placeholder="Rango" />
                        </div>
                        <div class="flex items-center gap-2">
                             <div class="text-xs text-gray-500">Color:</div>
                             <div class="flex flex-wrap gap-2">
                                <div v-for="c in predefinedColors" :key="c.label" 
                                        @click="form.color = c.value"
                                        class="w-6 h-6 rounded-full cursor-pointer border-2"
                                        :class="[c.value.split(' ')[0], form.color === c.value ? 'border-black' : 'border-transparent']"
                                        :title="c.label">
                                </div>
                            </div>
                        </div>
                        <button @click="handleSave" :disabled="!form.name" class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                            Crear Tipo
                        </button>
                     </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
