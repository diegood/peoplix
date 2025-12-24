<script setup>
import { Briefcase, Calendar, Power, Trash2, Edit2 } from 'lucide-vue-next'

defineProps({
    collab: Object
})

const emit = defineEmits(['toggle-active', 'delete', 'edit', 'view-profile'])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES')
}
</script>

<template>
   <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
        <div class="p-4 flex items-center justify-between" 
             :class="{ 'opacity-60 bg-gray-50': !collab.isActive }">
            
            <div class="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" @click="emit('view-profile', collab)">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                   :class="collab.isActive ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'">
                {{ collab.firstName?.charAt(0) || collab.name?.charAt(0) }}
              </div>
              
              <div class="min-w-0">
                <h3 class="font-bold text-gray-800 flex items-center gap-2 text-base">
                  <span class="truncate">{{ collab.firstName }} {{ collab.lastName }}</span>
                  <span v-if="!collab.isActive" class="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Inactivo</span>
                  <span v-if="collab.userName" class="text-xs text-blue-500/80 font-normal bg-blue-50 px-1.5 rounded">@{{ collab.userName }}</span>
                </h3>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  <span class="flex items-center gap-1.5" title="Horas contratadas">
                    <Briefcase size="14" class="text-gray-400" />
                    {{ collab.contractedHours }}h
                  </span>
                  <span class="flex items-center gap-1.5" title="Fecha de ingreso">
                    <Calendar size="14" class="text-gray-400" />
                    {{ formatDate(collab.joinDate) }}
                  </span>
                  <span v-if="collab.skills?.length" class="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      {{ collab.skills.length }} Skills
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <button @click.stop="emit('toggle-active', collab)" 
                      class="p-2 rounded-lg transition-colors"
                      :class="collab.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'"
                      :title="collab.isActive ? 'Desactivar' : 'Activar'">
                <Power size="18" />
              </button>
              
              <div class="h-6 w-px bg-gray-200 mx-1"></div>

              <button @click.stop="emit('delete', collab.id)" 
                      class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar permanentemente">
                <Trash2 size="18" />
              </button>
              <button @click.stop="emit('edit', collab)" class="p-2 hover:bg-blue-50 rounded-lg text-blue-600 bg-blue-50/50">
                <Edit2 size="18" />
              </button>
            </div>
        </div>
   </div>
</template>
