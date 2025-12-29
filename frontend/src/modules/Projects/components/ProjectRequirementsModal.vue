<script setup>
import { ref } from 'vue'
import SkillSelector from '@/components/SkillSelector.vue'
import { X, Trash2, Plus, Users, Clock, Briefcase } from 'lucide-vue-next'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ROLES } from '@/graphql/queries'
import { 
    ADD_PROJECT_REQUIREMENT, REMOVE_PROJECT_REQUIREMENT, 
    ADD_REQUIREMENT_SKILL, REMOVE_REQUIREMENT_SKILL 
} from '@/graphql/mutations'

const props = defineProps({
    project: Object,
    isOpen: Boolean
})

defineEmits(['close'])

const { result: rolesResult } = useQuery(GET_ROLES)
const { mutate: addRequirement } = useMutation(ADD_PROJECT_REQUIREMENT, { refetchQueries: ['GetProjects'] })
const { mutate: removeRequirement } = useMutation(REMOVE_PROJECT_REQUIREMENT, { refetchQueries: ['GetProjects'] })
const { mutate: addReqSkill } = useMutation(ADD_REQUIREMENT_SKILL, { refetchQueries: ['GetProjects'] })
const { mutate: removeReqSkill } = useMutation(REMOVE_REQUIREMENT_SKILL, { refetchQueries: ['GetProjects'] })

const requirementForm = ref({
    roleId: '',
    resourceCount: 1,
    monthlyHours: 160
})

const addingSkillToReqId = ref(null)
const newSkillForm = ref({ name: '', level: 1 })

const handleAddRequirement = async () => {
    if (!requirementForm.value.roleId) return
    
    await addRequirement({
        projectId: props.project.id,
        roleId: requirementForm.value.roleId,
        resourceCount: Number(requirementForm.value.resourceCount),
        monthlyHours: Number(requirementForm.value.monthlyHours)
    })
    
    requirementForm.value.roleId = ''
}

const toggleAddSkill = (reqId) => {
    if (addingSkillToReqId.value === reqId) {
        addingSkillToReqId.value = null
    } else {
        addingSkillToReqId.value = reqId
        newSkillForm.value = { name: '', level: 1 }
    }
}

const saveSkill = async (reqId) => {
    if (!newSkillForm.value.name) return
    await addReqSkill({
        projectId: props.project.id,
        requirementId: reqId,
        skillName: newSkillForm.value.name,
        level: Number(newSkillForm.value.level)
    })
    addingSkillToReqId.value = null
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <div>
                <h2 class="text-xl font-bold text-gray-800">Requerimientos de Roles</h2>
                <p class="text-sm text-gray-500">{{ project.name }}</p>
            </div>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <X size="20" />
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <div class="space-y-4">
                <div v-if="!project.requiredRoles || project.requiredRoles.length === 0" class="text-sm text-gray-400 italic py-4 text-center bg-gray-50 rounded-lg">
                    Sin roles definidos
                </div>
                <div v-else class="grid gap-4">
                    <div v-for="req in project.requiredRoles" :key="req.id" 
                         class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                        
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Briefcase size="20" />
                                </div>
                                <div>
                                    <div class="font-bold text-gray-800 text-lg">{{ req.role.name }}</div>
                                    <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span class="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                            <Users size="12" />
                                            {{ req.resourceCount || 1 }} Recurso(s)
                                        </span>
                                        <span class="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                            <Clock size="12" />
                                            {{ req.monthlyHours || 0 }} h/mes
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button @click="removeRequirement({ projectId: project.id, requirementId: req.id })" 
                                    class="text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size="18" />
                            </button>
                        </div>

                        <div class="ml-12 border-t border-gray-100 pt-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tecnologías Específicas</span>
                                <button @click="toggleAddSkill(req.id)" class="text-blue-500 hover:bg-blue-50 rounded p-1 flex items-center gap-1 text-[10px] font-bold">
                                    <Plus size="12" />
                                    Agregar Tech
                                </button>
                            </div>

                            <div v-if="addingSkillToReqId === req.id" class="bg-gray-50 p-2 rounded mb-2 border border-gray-200 flex gap-2 items-start">
                                <div class="flex-1">
                                     <SkillSelector 
                                        v-model="newSkillForm.name" 
                                        placeholder="Tech (ej. PyTest)" 
                                        class="text-xs"
                                    />
                                </div>
                                <select v-model="newSkillForm.level" class="text-xs border rounded p-2 h-[38px]">
                                     <option value="1">L1</option>
                                     <option value="2">L2</option>
                                     <option value="3">L3</option>
                                     <option value="4">L4</option>
                                </select>
                                <button @click="saveSkill(req.id)" class="bg-blue-600 text-white text-xs px-3 h-[38px] rounded font-medium">OK</button>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <span v-for="skill in req.skills" :key="skill.id" 
                                    class="pl-2 pr-1 py-1 bg-blue-50 text-blue-700 rounded text-xs flex items-center gap-1 group border border-blue-100">
                                    {{ skill.name }} <span class="text-blue-300">|</span> <span class="font-bold">L{{ skill.level }}</span>
                                    <button @click="removeReqSkill({ projectId: project.id, requirementId: req.id, skillId: skill.id })" 
                                            class="text-blue-300 hover:text-red-500 p-0.5 rounded hover:bg-white ml-1">
                                        <X size="12" />
                                    </button>
                                </span>
                                <span v-if="!req.skills || req.skills.length === 0" class="text-xs text-gray-300 italic">No hay tecnologías específicas asignadas</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size="18" class="text-blue-600"/>
                    Agregar Perfil / Rol
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-gray-500 mb-1">Rol Requerido</label>
                        <select v-model="requirementForm.roleId" class="w-full px-3 py-2 border rounded-lg bg-white">
                            <option value="" disabled selected>Seleccione un Rol...</option>
                            <option v-for="role in rolesResult?.roles" :key="role.id" :value="role.id">
                                {{ role.name }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 md:col-span-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-1">Recursos</label>
                            <input v-model="requirementForm.resourceCount" type="number" min="1" class="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-1">Horas/Mes</label>
                            <input v-model="requirementForm.monthlyHours" type="number" min="0" class="w-full px-3 py-2 border rounded-lg" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button @click="handleAddRequirement" 
                            :disabled="!requirementForm.roleId"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm">
                        Agregar Rol
                    </button>
                </div>
            </div>

        </div>
    </div>
  </div>
</template>
