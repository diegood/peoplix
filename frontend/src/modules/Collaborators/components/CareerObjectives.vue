<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { ADD_COLLABORATOR_CAREER_OBJECTIVE, UPDATE_COLLABORATOR_CAREER_OBJECTIVE, DELETE_COLLABORATOR_CAREER_OBJECTIVE } from '../graphql/collaborator.mutations'
import { Plus, Trash2, CheckCircle, Clock, PlayCircle, Target } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  objectives: { type: Array, default: () => [] },
  collaboratorId: { type: String, required: true },
  availableSkills: { type: Array, default: () => [] }
})
const emit = defineEmits(['refetch'])

const notificationStore = useNotificationStore()

const showForm = ref(false)
const newObjective = ref({
    year: new Date().getFullYear(),
    quarter: Math.floor((new Date().getMonth() + 3) / 3),
    description: '',
    skillId: null,
    targetLevel: 2
})

const { mutate: addObjective, loading: creating } = useMutation(ADD_COLLABORATOR_CAREER_OBJECTIVE)
const { mutate: updateObjective } = useMutation(UPDATE_COLLABORATOR_CAREER_OBJECTIVE)
const { mutate: deleteObjective } = useMutation(DELETE_COLLABORATOR_CAREER_OBJECTIVE)

const submitObjective = async () => {
    if (!newObjective.value.description) return
    try {
        await addObjective({
            collaboratorId: props.collaboratorId,
            year: parseInt(newObjective.value.year),
            quarter: parseInt(newObjective.value.quarter),
            description: newObjective.value.description,
            skillId: newObjective.value.skillId,
            targetLevel: parseInt(newObjective.value.targetLevel)
        })
        notificationStore.showToast('Objetivo agregado', 'success')
        newObjective.value.description = ''
        newObjective.value.skillId = null
        newObjective.value.targetLevel = 2
        emit('refetch')
        showForm.value = false
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const updateStatus = async (obj, status) => {
    try {
        await updateObjective({ id: obj.id, status })
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message || "Error al actualizar estado", "error")
    }
}

const removeObjective = async (id) => {
    if (!await notificationStore.showDialog('¿Eliminar objetivo?', 'Eliminar Objetivo')) return
    try {
        await deleteObjective({ id })
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message || "Error al eliminar", "error")
    }
}

const groupedObjectives = computed(() => {
    const groups = {}
    props.objectives.forEach(obj => {
        const key = `${obj.year}-Q${obj.quarter}`
        if (!groups[key]) {
            groups[key] = { year: obj.year, quarter: obj.quarter, items: [] }
        }
        groups[key].items.push(obj)
    })
    
    return Object.values(groups).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.quarter - b.quarter
    })
})
</script>

<template>
  <div class="space-y-6">
      
      <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
             <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><Target size="20" /></div>
             <h3 class="text-lg font-bold text-gray-800">Objetivos Trimestrales</h3>
          </div>
          
          <button v-if="!showForm" @click="showForm = true" class="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors">
              <Plus size="16" /> Agregar
          </button>
      </div>

      <div v-if="showForm" class="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-in slide-in-from-top-2">
          <h4 class="font-bold text-gray-700 mb-3 text-sm">Nuevo Objetivo</h4>
          <div class="space-y-3">
              <div class="flex gap-4">
                  <div class="w-24">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Año</label>
                      <input v-model="newObjective.year" type="number" class="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2" />
                  </div>
                  <div class="w-24">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Quarter</label>
                      <select v-model="newObjective.quarter" class="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2">
                          <option :value="1">Q1</option>
                          <option :value="2">Q2</option>
                          <option :value="3">Q3</option>
                          <option :value="4">Q4</option>
                      </select>
                  </div>
              </div>
              <div class="flex gap-4">
                  <div class="flex-1">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Skill Asociado (Opcional)</label>
                       <select v-model="newObjective.skillId" class="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-gray-700">
                          <option :value="null">Sin skill específico</option>
                          <option v-for="skill in availableSkills" :key="skill.id" :value="skill.id">{{ skill.name }}</option>
                       </select>
                  </div>
                  <div class="w-24" v-if="newObjective.skillId">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Nivel Meta</label>
                      <select v-model="newObjective.targetLevel" class="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2">
                           <option v-for="l in 4" :key="l" :value="l">{{ l }}</option>
                      </select>
                  </div>
              </div>
              <div>
                   <label class="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                   <textarea v-model="newObjective.description" rows="2" class="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 placeholder-gray-400" placeholder="Ej: Obtener certificación AWS Cloud Practitioner..."></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                  <button @click="showForm = false" class="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm">Cancelar</button>
                  <button @click="submitObjective" :disabled="creating || !newObjective.description" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                      {{ creating ? 'Guardando...' : 'Guardar Objetivo' }}
                  </button>
              </div>
          </div>
      </div>

      <div v-for="group in groupedObjectives" :key="`${group.year}-${group.quarter}`" class="border border-gray-100 rounded-xl overflow-hidden">
          <div class="bg-gray-50/80 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <h4 class="font-bold text-gray-700 text-sm uppercase tracking-wide">Q{{ group.quarter }} {{ group.year }}</h4>
              <span class="text-xs text-gray-400 font-medium">{{ group.items.length }} Objetivos</span>
          </div>
          <div class="divide-y divide-gray-50">
              <div v-for="obj in group.items" :key="obj.id" class="px-4 py-3 bg-white flex justify-between items-start group hover:bg-gray-50/50 transition-colors">
                  <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-600 leading-relaxed pt-1">{{ obj.description }}</p>
                      <div v-if="obj.skill" class="mt-2 flex items-center gap-2">
                          <span class="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-medium">
                              🎯 {{ obj.skill.name }}
                          </span>
                          <span v-if="obj.targetLevel" class="text-xs text-gray-500">
                              Nivel meta: <span class="font-bold text-gray-700">{{ obj.targetLevel }}</span>
                          </span>
                      </div>
                  </div>
                  
                  <div class="flex items-center gap-3 shrink-0 ml-4">
                      
                      <!-- Status Actions -->
                      <div class="flex bg-gray-100 rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button @click="updateStatus(obj, 'PENDING')" :class="{'bg-white shadow-sm text-yellow-600': obj.status === 'PENDING'}" class="p-1 rounded text-gray-400 hover:text-yellow-600" title="Pendiente"><Clock size="14"/></button>
                          <button @click="updateStatus(obj, 'IN_PROGRESS')" :class="{'bg-white shadow-sm text-blue-600': obj.status === 'IN_PROGRESS'}" class="p-1 rounded text-gray-400 hover:text-blue-600" title="En Progreso"><PlayCircle size="14"/></button>
                          <button @click="updateStatus(obj, 'COMPLETED')" :class="{'bg-white shadow-sm text-green-600': obj.status === 'COMPLETED'}" class="p-1 rounded text-gray-400 hover:text-green-600" title="Completado"><CheckCircle size="14"/></button>
                      </div>

                      <span class="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border min-w-[80px] text-center"
                            :class="{
                                'bg-yellow-50 text-yellow-600 border-yellow-100': obj.status === 'PENDING',
                                'bg-blue-50 text-blue-600 border-blue-100': obj.status === 'IN_PROGRESS',
                                'bg-green-50 text-green-600 border-green-100': obj.status === 'COMPLETED'
                            }"
                      >
                          {{ obj.status === 'IN_PROGRESS' ? 'EN CURSO' : obj.status }}
                      </span>
                      
                      <button @click="removeObjective(obj.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size="14" />
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div v-if="groupedObjectives.length === 0 && !showForm" class="text-center text-gray-400 py-12 border-2 border-dashed border-gray-100 rounded-xl">
          <span class="block text-sm">No hay objetivos definidos para este periodo.</span>
      </div>
  </div>
</template>
