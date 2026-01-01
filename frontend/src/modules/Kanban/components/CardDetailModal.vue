<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X, AlignLeft, List, Trash } from 'lucide-vue-next'
import { useKanbanStore } from '../store/kanban.store'
import { useSubscription } from '@vue/apollo-composable'
import { CARD_UPDATED_SUBSCRIPTION } from '../graphql/kanban'
import { useNotificationStore } from '@/stores/notificationStore'

const store = useKanbanStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const props = defineProps({
  isOpen: Boolean,
  card: Object
})

const emit = defineEmits(['close', 'open-card'])

const localCard = ref({})

import TiptapEditor from './TiptapEditor.vue'
import CardComments from './CardComments.vue'
import CardTimeline from './CardTimeline.vue'
import SimpleTabs from '@/components/SimpleTabs.vue'

const tabs = [
    { id: 'details', label: 'Detalles' },
    { id: 'timeline', label: 'Cronología' }
]
const activeTab = ref('details')

watch(() => props.card, async (newCard) => {
    if (newCard) {
        localCard.value = JSON.parse(JSON.stringify(newCard))
        
        const fullCard = await store.fetchCard(newCard.id, { 
            projectTag: newCard.project?.tag, 
            orgTag: newCard.project?.organization?.tag 
        })
        if (fullCard) {
            localCard.value = fullCard
        }
    }
}, { immediate: true, deep: true })

const { result: subscriptionResult } = useSubscription(CARD_UPDATED_SUBSCRIPTION, () => ({
    cardId: props.card?.id
}), {
    enabled: () => !!props.card?.id
})

watch(subscriptionResult, (data) => {
    if (data?.cardUpdated) {
        localCard.value = JSON.parse(JSON.stringify(data.cardUpdated))
    }
})

const handleDelete = async () => {
    if(await notificationStore.showDialog('¿Seguro que deseas eliminar esta tarjeta?', 'Eliminar Tarjeta')) {
        await store.deleteCard(localCard.value.id)
        emit('close')
    }
}

const newSubtaskTitle = ref('')
const handleSubtaskToggle = async (child, isChecked) => {
    try {
        const newStatus = isChecked ? 'done' : 'todo'
        await store.moveCard(child.id, newStatus)
        
        if (localCard.value.children) {
            const childIdx = localCard.value.children.findIndex(c => c.id === child.id)
            if (childIdx !== -1) {
                localCard.value.children[childIdx].status = newStatus
            }
        }
    } catch (e) {
        console.error('Failed to toggle subtask', e)
    }
}

const handleAddSubtask = async () => {
    if (!newSubtaskTitle.value) return
    try {
        const newSubtask = await store.addSubtask(localCard.value.id, newSubtaskTitle.value)
        if (newSubtask) {
             if (!localCard.value.children) localCard.value.children = []
             localCard.value.children.push(newSubtask)
        }
        newSubtaskTitle.value = ''
    } catch (e) {
        console.error(e)
        notificationStore.showToast('Error al crear subtarea', 'error')
    }
}



const openProject = () => {
    if (localCard.value.project?.tag && localCard.value.project?.organization?.tag) {
        router.push({ 
            name: 'tagged-kanban-board', 
            params: { 
                orgTag: localCard.value.project.organization.tag, 
                projectTag: localCard.value.project.tag 
            },
            query: { onlyMy: 'true' }
        })
    } else if (localCard.value.project?.id) {
         router.push({ 
             name: 'project-kanban', 
             params: { id: localCard.value.project.id },
             query: { onlyMy: 'true' }
         })
    }
}

const formatDate = (dateValue) => {
    if (!dateValue) return '-'
    const d = new Date(parseInt(dateValue) || dateValue)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString()
}

const updateDate = async (field, value) => {
    if (!value) return
    try {
        const dateObj = new Date(value)
        const updated = await store.updateCard(localCard.value.id, { [field]: dateObj.toISOString() })
        if (updated) {
            localCard.value = { ...localCard.value, ...updated }
        } else {
             localCard.value[field] = dateObj.toISOString()
        }
    } catch (e) {
        console.error('Failed to update date', e)
    }
}

const handleStatusChange = async (event) => {
    const newStatus = event.target.value
    try {
        await store.moveCard(localCard.value.id, newStatus)
        localCard.value.status = newStatus
    } catch (e) {
        console.error('Failed to update status', e)
    }
}


const handleDescriptionSave = async () => {
    try {
        await store.updateCard(localCard.value.id, { description: localCard.value.description })
    } catch (e) {
        console.error('Failed to save description', e)
    }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="px-6 py-4 border-b flex justify-between items-start bg-gray-50">
             <div class="flex-1">
                 <div class="flex items-center gap-1 text-xs text-gray-500 mb-2 flex-wrap">
                      <button @click="openProject" class="font-semibold text-gray-700 hover:text-blue-600 hover:underline">
                          {{ localCard.project?.name || 'Global' }}
                      </button>
                      
                      <span v-if="localCard.breadcrumbs?.length" class="text-gray-400">/</span>
                      
                      <template v-for="(bc) in localCard.breadcrumbs" :key="bc.id">
                          <button @click="$emit('open-card', bc)" class="hover:text-blue-600 hover:underline">
                              {{ bc.readableId }}
                          </button>
                          <span class="text-gray-400">/</span>
                      </template>
                      
                      <span class="text-gray-900 font-medium truncate max-w-[200px]">{{ localCard.title }}</span>
                 </div>
                 <h2 class="text-xl font-bold text-gray-900">{{ localCard.title }}</h2>
             </div>
             <button @click="handleDelete" class="text-red-400 hover:text-red-600 transition-colors mr-2">
                 <Trash size="20" />
             </button>
             <button @click="$emit('close')" class="text-gray-400 hover:text-gray-700 transition-colors">
                 <X size="24" />
             </button>
          </div>
          
          <SimpleTabs :tabs="tabs" @change="id => activeTab = id" class="px-6" />

          <div class="flex-1 flex overflow-hidden">
              <div class="flex-1 p-6 overflow-y-auto w-2/3 border-r border-gray-100">
                  
                  <div v-if="activeTab === 'details'" class="animate-in fade-in duration-200">
                      <div class="mb-8">
                           <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                               <AlignLeft size="16"/> Descripción
                           </h3>
                           <div class="h-64 flex flex-col">
                              <TiptapEditor 
                                v-model="localCard.description" 
                                @blur="handleDescriptionSave"
                                class="h-full"
                              />
                           </div>
                      </div>

                      <div class="mb-8">
                          <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                              <List size="16"/> Subtareas ({{ localCard.children?.length || 0 }})
                          </h3>
                          <div class="mb-4 flex gap-2">
                              <input 
                                  v-model="newSubtaskTitle"
                                  @keydown.enter="handleAddSubtask"
                                  placeholder="Nueva subtarea..." 
                                  class="flex-1 text-sm border-gray-200 rounded-md p-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <button @click="handleAddSubtask" class="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50" :disabled="!newSubtaskTitle">
                                  +
                              </button>
                          </div>
                          <div v-if="localCard.children?.length" class="space-y-2">
                              <div v-for="child in localCard.children" :key="child.id" class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                  <input 
                                      type="checkbox" 
                                      :checked="child.status === 'done'" 
                                      @change="(e) => handleSubtaskToggle(child, e.target.checked)"
                                      class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                  />
                                  <button @click="$emit('open-card', child)" class="text-left hover:text-blue-600 hover:underline flex-1" :class="{'line-through text-gray-400': child.status === 'done'}">
                                      {{ child.readableId }} {{ child.title }}
                                  </button>
                              </div>
                          </div>
                          <div v-else class="text-center py-4 text-gray-400 text-sm">
                              No hay subtareas
                          </div>
                      </div>

                      <CardComments 
                        v-if="localCard.id" 
                        :card-id="localCard.id" 
                        :comments="localCard.comments"
                        @added="(newComment) => localCard.comments.push(newComment)"
                      />
                  </div>

                  <div v-if="activeTab === 'timeline'" class="animate-in fade-in duration-200">
                      <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                          Historial de Actividad
                      </h3>
                      <CardTimeline :timeline="localCard.timeline" />
                  </div>

              </div>

              <div class="w-1/3 bg-gray-50 p-6 overflow-y-auto">
                  <h3 class="text-xs font-bold text-gray-500 uppercase mb-4">Detalles</h3>
                  
                  <div class="space-y-4">
                      <div>
                          <label class="text-xs text-gray-400 block mb-1">Estado</label>
                          <select 
                              :value="localCard.status" 
                              @change="handleStatusChange"
                              class="w-full text-sm border-gray-200 rounded-md p-2 bg-white border focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                          </select>
                      </div>

                      <div>
                          <label class="text-xs text-gray-400 block mb-1">Riesgo</label>
                          <select class="w-full text-sm border-gray-200 rounded-md p-2 bg-white border">
                              <option value="NONE">Ninguno</option>
                              <option value="LOW">Bajo</option>
                              <option value="MEDIUM">Medio</option>
                              <option value="HIGH">Alto</option>
                          </select>
                      </div>

                       <div>
                           <label class="text-xs text-gray-400 block mb-1">Fechas Planificadas</label>
                           <div class="grid grid-cols-2 gap-2 mb-2">
                               <div class="bg-white p-2 rounded flex flex-col gap-0.5 text-xs text-gray-600">
                                   <span class="text-[10px] text-gray-400">Inicio Est.</span>
                                   <div class="flex items-center gap-1">{{ formatDate(localCard.estimatedStartDate) }}</div>
                               </div>
                               <div class="bg-white p-2 rounded flex flex-col gap-0.5 text-xs text-gray-600">
                                   <span class="text-[10px] text-gray-400">Fin Est.</span>
                                   <div class="flex items-center gap-1">{{ formatDate(localCard.estimatedEndDate) }}</div>
                               </div>
                           </div>
                           
                           <label class="text-xs text-gray-400 block mb-1">Fechas Reales</label>
                           <div class="grid grid-cols-2 gap-2">
                               <div class="bg-white border p-2 rounded flex items-center gap-2 text-sm text-gray-600">
                                   <input 
                                       type="date" 
                                       :value="localCard.startDate ? new Date(parseInt(localCard.startDate) || localCard.startDate).toISOString().split('T')[0] : ''"
                                       @change="(e) => updateDate('startDate', e.target.value)"
                                       class="w-full bg-transparent outline-none text-xs"
                                   />
                               </div>
                               <div class="bg-white border p-2 rounded flex items-center gap-2 text-sm text-gray-600">
                                   <input 
                                       type="date" 
                                       :value="localCard.endDate ? new Date(parseInt(localCard.endDate) || localCard.endDate).toISOString().split('T')[0] : ''"
                                       @change="(e) => updateDate('endDate', e.target.value)"
                                       class="w-full bg-transparent outline-none text-xs"
                                   />
                               </div>
                           </div>
                      </div>

                      <div>
                          <label class="text-xs text-gray-400 block mb-1">Asignados</label>
                          <div class="flex flex-wrap gap-2">
                              <div v-for="collab in localCard.collaborators" :key="collab.id" class="flex items-center gap-2 px-3 py-1 bg-white border rounded-full text-sm">
                                  <div class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                      {{ collab.firstName[0] }}
                                  </div>
                                  <span>{{ collab.firstName }}</span>
                              </div>
                              <button class="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500">
                                  +
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>
