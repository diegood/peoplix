<script setup>
import { Search, UserPlus } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
    modelValue: String
})

const emit = defineEmits(['update:modelValue', 'create'])

const searchQuery = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
</script>

<template>
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
            <h2 class="text-xl font-bold text-gray-800">Colaboradores</h2>
            <p class="text-sm text-gray-500">Gestión de equipo, competencias y recursos</p>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
                <Search class="absolute left-3 top-2.5 text-gray-400" size="18" />
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Buscar colaborador..." 
                    class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
            </div>
            <button @click="emit('create')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow transition-all">
                <UserPlus size="18" />
                Nuevo
            </button>
        </div>
    </div>
</template>
