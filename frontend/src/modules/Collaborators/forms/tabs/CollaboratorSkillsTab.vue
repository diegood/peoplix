<script setup>
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
  ADD_COLLABORATOR_SKILL, 
  REMOVE_COLLABORATOR_SKILL
} from '@/modules/Collaborators/graphql/collaborator.queries'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'
import SkillSelector from '@/components/SkillSelector.vue'

const props = defineProps({
  collaboratorId: { type: String, required: true },
  skills: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:skills'])
const notificationStore = useNotificationStore()

// State
const addingSkill = ref(false)
const newSkillForm = ref({ name: '', level: '1', id: null })

// Mutations
const { mutate: addSkill } = useMutation(ADD_COLLABORATOR_SKILL)
const { mutate: removeSkill } = useMutation(REMOVE_COLLABORATOR_SKILL)

const handleSkillSelect = (skill) => {
  newSkillForm.value.id = skill.id
  newSkillForm.value.name = skill.name
}

const onSaveSkill = async () => {
  if (!newSkillForm.value.id) {
     notificationStore.showToast("Selecciona un skill", "error")
     return
  }
  try {
    const res = await addSkill({
      collaboratorId: props.collaboratorId,
      skillId: newSkillForm.value.id,
      level: parseInt(newSkillForm.value.level)
    })
    
    if (res?.data?.addCollaboratorSkill) {
        emit('update:skills', res.data.addCollaboratorSkill.skills)
    }

    addingSkill.value = false
    newSkillForm.value = { name: '', level: '1', id: null }
    notificationStore.showToast("Skill agregado", "success")
  } catch(e) {
    notificationStore.showToast(e.message, "error")
  }
}

const onRemoveSkill = async (skillId) => {
    try {
        const res = await removeSkill({ collaboratorId: props.collaboratorId, skillId })
        if (res?.data?.removeCollaboratorSkill) {
             emit('update:skills', res.data.removeCollaboratorSkill.skills)
        }
        notificationStore.showToast("Skill eliminado", "success")
    } catch(e) {
        notificationStore.showToast(e.message, "error")
    }
}
</script>

<template>
    <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-700">Competencias y Habilidades</h3>
                <button @click="addingSkill = !addingSkill" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors text-xs flex items-center gap-1">
                    <Plus size="14" /> Agregar Skill
                </button>
            </div>
            
            <div v-if="addingSkill" class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-2">
                <div class="flex items-end gap-2">
                    <div class="flex-1">
                        <label class="text-xs text-blue-700 font-medium mb-1 block">Skill</label>
                        <SkillSelector 
                            v-model="newSkillForm.name" 
                            @select="handleSkillSelect"
                            placeholder="Buscar..." 
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                        />
                    </div>
                    <div class="w-24">
                        <label class="text-xs text-blue-700 font-medium mb-1 block">Nivel (1-4)</label>
                        <select v-model="newSkillForm.level" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
                            <option value="1">L1 - Junior</option>
                            <option value="2">L2 - Mid</option>
                            <option value="3">L3 - Senior</option>
                            <option value="4">L4 - Lead</option>
                        </select>
                    </div>
                    <button @click="onSaveSkill" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm hover:shadow mb-[1px]">Guardar</button>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="skillRel in skills" :key="skillRel.id" 
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                    <div>
                        <div class="font-bold text-gray-700">{{ skillRel.skill.name }}</div>
                        <div class="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                            Nivel {{ skillRel.level }}
                        </div>
                    </div>
                    <button @click="onRemoveSkill(skillRel.skill.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size="16" />
                    </button>
                </div>
                <div v-if="!skills?.length" class="col-span-full text-center py-8 text-gray-400 italic">
                    No hay skills asignados aún.
                </div>
            </div>
        </div>
    </div>
</template>
