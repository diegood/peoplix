```vue
<script setup>
import { computed, ref } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { CREATE_MILESTONE, DELETE_MILESTONE } from '@/graphql/mutations'
import { GET_MILESTONE_TYPES } from '@/graphql/queries'
import { Plus, Trash2, Flag} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import { stringToColor } from '@/helper/Colors'

const notificationStore = useNotificationStore()

const props = defineProps({
  project: { type: Object, required: true },
  currentWeek: { type: String, required: true } // '2025-W10'
})

const isExpanded = ref(false)
const showForm = ref(false)
const newMilestone = ref({ name: '', date: '', type: null })

// Fetch correct types from backend
const { result: milestoneTypesResult } = useQuery(GET_MILESTONE_TYPES)
const typeOptions = computed(() => milestoneTypesResult.value?.milestoneTypes || [])

const { mutate: createMilestone } = useMutation(CREATE_MILESTONE, { refetchQueries: ['GetProjects'] })
const { mutate: deleteMilestone } = useMutation(DELETE_MILESTONE, { refetchQueries: ['GetProjects'] })

const weekDates = computed(() => {
    const [y, w] = props.currentWeek.split('-W').map(Number)
    const simple = new Date(Date.UTC(y, 0, 4))
    const week1Start = simple.setUTCDate(simple.getUTCDate() - (simple.getUTCDay() || 7) + 1)
    const weekStart = new Date(week1Start + (w - 1) * 7 * 86400000)
    
    const days = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getTime() + i * 86400000)
        days.push({
            date: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
            dayNum: d.getDate()
        })
    }
    return days
})

const weekMilestones = computed(() => {
    if (!props.project.milestones) return []
    const weekIsoDates = weekDates.value.map(d => d.date)
    return props.project.milestones.filter(m => weekIsoDates.includes(m.date))
})

const upcomingMilestones = computed(() => {
    if (!props.project.milestones) return []
    return props.project.milestones
        .filter(m => m.date >= new Date().toISOString().split('T')[0])
        .sort((a, b) => a.date.localeCompare(b.date))
})

const getTypeColor = (milestoneOrType) => {
    // If it's a milestone object with a rich type
    let color = milestoneOrType?.milestoneType?.color
    
    if (color) {
        if (color.startsWith('#') || color.startsWith('rgb')) {
            return `bg-[${color}]`
        }
        return color // Assume it is a Tailwind class like 'bg-red-400'
    }
    
    // Fallback/Legacy
    const typeStr = typeof milestoneOrType === 'string' ? milestoneOrType : (milestoneOrType?.type || milestoneOrType?.name || '?')
    return `bg-[${stringToColor(typeStr)}]`
}

const handleCreate = async () => {
    if (!newMilestone.value.name || !newMilestone.value.date || !newMilestone.value.type) return
    
    // Check if newMilestone.value.type is an object (from Multiselect)
    const selected = newMilestone.value.type
    
    await createMilestone({
        projectId: props.project.id,
        name: newMilestone.value.name,
        date: newMilestone.value.date,
        milestoneTypeId: selected.id
    })
    showForm.value = false
    // Reset defaults (pick first if available?)
    newMilestone.value = { name: '', date: '', type: null }
}

const handleDelete = async (id) => {
    if(await notificationStore.showDialog('¿Borrar hito?')) await deleteMilestone({ id })
}
</script>

<template>
  <div class="bg-gray-50 border-b border-gray-100 p-3 text-sm">
      <div class="flex items-center justify-between mb-2">
          <div class="font-bold text-gray-700 flex items-center gap-2 cursor-pointer" @click="isExpanded = !isExpanded">
              <Flag size="14" class="text-purple-500" />
              <span>Hitos & Entregas</span>
               <span v-if="weekMilestones.length" class="bg-purple-100 text-purple-700 px-1.5 rounded-full text-[10px]">{{ weekMilestones.length }} esta semana</span>
          </div>
          <button @click="showForm = !showForm" class="text-gray-400 hover:text-purple-600">
              <Plus size="16" />
          </button>
      </div>

      <div v-if="showForm" class="bg-white p-2 rounded shadow mb-3 border border-purple-100 relative">
          <input v-model="newMilestone.name" placeholder="Nombre (ej. Entrega Fase 1)" class="w-full text-xs border rounded p-1 mb-1" />
          <div class="flex gap-1 mb-1">
              <input v-model="newMilestone.date" type="date" class="flex-1 text-xs border rounded p-1 w-1/2" />
               <div class="w-1/2">
                   <VueMultiselect
                        v-model="newMilestone.type"
                        :options="typeOptions"
                        :taggable="false"
                        label="name"
                        track-by="id"
                        placeholder="Tipo"
                        select-label=""
                        deselect-label=""
                        class="text-xs"
                    />
               </div>
          </div>
          <button @click="handleCreate" class="w-full mt-1 bg-purple-600 text-white text-xs py-1 rounded hover:bg-purple-700">Guardar</button>
      </div>

      <!-- Timeline (Only visible if expanded or if there are milestones this week) -->
      <div v-if="isExpanded || weekMilestones.length > 0" class="flex gap-1 mb-2">
          <div v-for="day in weekDates" :key="day.date" 
               class="flex-1 flex flex-col items-center p-1 rounded transition-colors"
               :class="{ 'bg-purple-50 border border-purple-200': weekMilestones.find(m => m.date === day.date), 'bg-white border border-gray-100': !weekMilestones.find(m => m.date === day.date) }">
              <span class="text-[10px] text-gray-400 uppercase">{{ day.dayName }}</span>
              <span class="font-bold text-xs">{{ day.dayNum }}</span>
              
              <div class="flex flex-col gap-0.5 mt-1 w-full">
                  <div v-for="m in weekMilestones.filter(x => x.date === day.date)" :key="m.id"
                       class="h-1.5 w-full rounded-full"
                       :class="getTypeColor(m)"
                       :title="m.name + ' (' + (m.milestoneType?.name || m.type) + ')'">
                  </div>
              </div>
          </div>
      </div>

      <div v-if="isExpanded" class="space-y-1 mt-2 border-t border-gray-200 pt-2">
          <p class="text-[10px] text-gray-400 uppercase font-bold">Próximos</p>
          <div v-for="m in upcomingMilestones.slice(0, 3)" :key="m.id" class="flex items-center justify-between group">
              <div class="flex items-center gap-2">
                   <div class="w-2 h-2 rounded-full" 
                        :class="getTypeColor(m)"></div>
                   <span class="text-xs text-gray-600 truncate max-w-[120px]" :title="m.name">{{ m.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                  <span class="text-[10px] text-gray-400">{{ m.date }}</span>
                  <button @click="handleDelete(m.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size="12"/></button>
              </div>
          </div>
          <div v-if="upcomingMilestones.length === 0" class="text-xs text-gray-400 italic">No hay hitos próximos</div>
      </div>
  </div>
</template>

<style>
.multiselect {
    min-height: 28px !important;
}
.multiselect__tags {
    min-height: 28px !important;
    padding: 2px 40px 0 2px !important;
    font-size: 0.75rem !important;
}
.multiselect__select {
    height: 26px !important;
    width: 20px !important;
    padding: 0 !important;
}
.multiselect__single {
    font-size: 0.75rem !important;
    margin-bottom: 0 !important;
    margin-top: 1px !important;
}
.multiselect__input {
     font-size: 0.75rem !important;
     margin-bottom: 0 !important;
}
</style>
