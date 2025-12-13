<script setup>
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_COLLABORATORS, CREATE_COLLABORATOR, ADD_COLLABORATOR_SKILL, REMOVE_COLLABORATOR_SKILL } from '@/graphql/queries'
import { UserPlus, User, Clock, Briefcase, Plus, X } from 'lucide-vue-next'
import SkillSelector from './SkillSelector.vue'

const { result, loading, error } = useQuery(GET_COLLABORATORS)
const { mutate: createCollaborator } = useMutation(CREATE_COLLABORATOR, { refetchQueries: ['GetCollaborators'] })
const { mutate: addSkill } = useMutation(ADD_COLLABORATOR_SKILL, { refetchQueries: ['GetCollaborators'] })
const { mutate: removeSkill } = useMutation(REMOVE_COLLABORATOR_SKILL, { refetchQueries: ['GetCollaborators'] })

const form = ref({
  name: '',
  contractedHours: 40
})

// Manage skills state
const addingSkillToId = ref(null)
const newSkillForm = ref({ name: '', level: 1 })

const handleCreate = async () => {
  if (!form.value.name) return
  await createCollaborator({ 
    name: form.value.name, 
    contractedHours: Number(form.value.contractedHours) 
  })
  form.value.name = ''
  form.value.contractedHours = 40
}

const toggleAddSkill = (collabId) => {
    if (addingSkillToId.value === collabId) {
        addingSkillToId.value = null
    } else {
        addingSkillToId.value = collabId
        newSkillForm.value = { name: '', level: 1 }
    }
}

const saveSkill = async (collabId) => {
    if (!newSkillForm.value.name) return
    await addSkill({
        collaboratorId: collabId,
        skillName: newSkillForm.value.name,
        level: Number(newSkillForm.value.level)
    })
    addingSkillToId.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header/Create -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4">
      <div class="flex-1 space-y-1">
        <label class="text-sm font-medium text-gray-700">Nombre Completo</label>
        <div class="relative">
          <input v-model="form.name" 
                 type="text" 
                 placeholder="ej. Juan Pérez" 
                 class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          <User class="absolute left-3 top-2.5 text-gray-400" size="18" />
        </div>
      </div>
      <div class="w-48 space-y-1">
        <label class="text-sm font-medium text-gray-700">Contrato (Horas/Semana)</label>
        <div class="relative">
          <input v-model="form.contractedHours" 
                 type="number" 
                 min="0"
                 class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          <Clock class="absolute left-3 top-2.5 text-gray-400" size="18" />
        </div>
      </div>
      <button @click="handleCreate" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mb-[1px]">
        <UserPlus size="20" />
        Crear
      </button>
    </div>

    <!-- List -->
    <div v-if="loading">Cargando colaboradores...</div>
    <div v-else-if="error" class="text-red-500">{{ error.message }}</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="collab in result.collaborators" :key="collab.id" 
           class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
        
        <div class="flex items-center gap-4 mb-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg">
            {{ collab.name.charAt(0) }}
            </div>
            
            <div>
            <h3 class="font-bold text-gray-800">{{ collab.name }}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span class="flex items-center gap-1">
                <Briefcase size="14" />
                {{ collab.contractedHours }}hr
                </span>
            </div>
            </div>
        </div>
        
        <!-- Skills -->
        <div class="border-t border-gray-100 pt-3">
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-gray-400 uppercase">Skills</span>
                <button @click="toggleAddSkill(collab.id)" class="text-blue-500 hover:bg-blue-50 rounded p-1">
                    <Plus size="14" />
                </button>
            </div>

            <!-- Add Form Overlay -->
            <div v-if="addingSkillToId === collab.id" class="bg-gray-50 p-2 rounded mb-2 border border-gray-200">
                <SkillSelector 
                    v-model="newSkillForm.name" 
                    placeholder="Skill..." 
                    class="mb-2 text-xs"
                />
                <div class="flex gap-2">
                    <select v-model="newSkillForm.level" class="text-xs border rounded flex-1">
                         <option value="1">L1</option>
                         <option value="2">L2</option>
                         <option value="3">L3</option>
                         <option value="4">L4</option>
                    </select>
                    <button @click="saveSkill(collab.id)" class="bg-blue-600 text-white text-xs px-2 rounded">OK</button>
                </div>
            </div>

            <div class="flex flex-wrap gap-1">
                <span v-for="skill in collab.skills" :key="skill.id" 
                    class="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 flex items-center gap-1 group">
                {{ skill.name }} (L{{ skill.level }})
                <button @click="removeSkill({ collaboratorId: collab.id, skillId: skill.id })" class="text-blue-300 hover:text-red-500 hidden group-hover:block">
                    <X size="10"/>
                </button>
                </span>
                <span v-if="!collab.skills.length" class="text-xs text-gray-300 italic">Sin skills</span>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>
