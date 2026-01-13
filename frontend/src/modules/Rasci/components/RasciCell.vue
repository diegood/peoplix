<script setup>
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  role: String, // RESPONSIBLE, ACCOUNTABLE, SUPPORT, CONSULTED, INFORMED
  isHeader: Boolean,
  label: String
})

const emit = defineEmits(['update'])

const showMenu = ref(false)

const roles = [
  { id: 'RESPONSIBLE', label: 'R', name: 'Responsable', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'ACCOUNTABLE', label: 'A', name: 'Aprobador', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'SUPPORT', label: 'S', name: 'Soporte', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'CONSULTED', label: 'C', name: 'Consultado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'INFORMED', label: 'I', name: 'Informado', color: 'bg-gray-100 text-gray-700 border-gray-200' }
]

const currentRole = computed(() => roles.find(r => r.id === props.role))

const toggleMenu = () => {
    showMenu.value = !showMenu.value
}

const selectRole = (roleId) => {
    emit('update', roleId)
    showMenu.value = false
}
</script>

<template>
  <div class="relative w-full h-full min-h-[40px] flex items-center justify-center">
    <button 
        @click="toggleMenu" 
        :class="['w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition border', 
            currentRole ? currentRole.color : 'text-gray-300 border-transparent hover:bg-gray-50 hover:border-gray-200']"
    >
        {{ currentRole ? currentRole.label : '+' }}
    </button>

    <div v-if="showMenu" 
        class="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-100 w-40 overflow-hidden"
    >
        <div class="fixed inset-0 z-40 bg-transparent" @click="showMenu = false"></div>
        
        <div class="relative z-50 flex flex-col py-1">
            <button v-for="r in roles" :key="r.id" 
                @click="selectRole(r.id)"
                class="px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-left text-xs"
            >
                <div :class="['w-6 h-6 rounded flex items-center justify-center font-bold border', r.color]">
                    {{ r.label }}
                </div>
                <div class="flex flex-col">
                    <span class="font-medium text-gray-700">{{ r.name }}</span>
                    <span class="text-[10px] text-gray-400 capitalize">{{ r.id.toLowerCase() }}</span>
                </div>
            </button>
            <div class="border-t border-gray-100 my-1"></div>
            <button @click="selectRole(null)" class="px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-xs">
                <X size="14"/> Quitar Asignación
            </button>
        </div>
    </div>
  </div>
</template>
