<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_PROJECTS } from '@/modules/Projects/graphql/project.queries'
import { CREATE_PROJECT, UPDATE_PROJECT } from '@/graphql/mutations'
import { FolderPlus, Clock, Edit2, SlidersHorizontal, Calendar, BarChart } from 'lucide-vue-next'
import ProjectRequirementsModal from './ProjectRequirementsModal.vue'
import ProjectVacationModal from './Project/ProjectVacationModal.vue'

const { result, loading, error } = useQuery(GET_PROJECTS)
const { mutate: createProject } = useMutation(CREATE_PROJECT, { refetchQueries: ['GetProjects'] })
const { mutate: updateProject } = useMutation(UPDATE_PROJECT, { refetchQueries: ['GetProjects'] })
const router = useRouter()

const goToEstimation = (projectId) => {
    router.push({ name: 'project-estimation', params: { id: projectId } })
}

const form = ref({
  name: '',
  contractedHours: 40
})

const editingId = ref(null)
const editForm = ref({ name: '', contractedHours: 0 })

const requirementsModalOpen = ref(false)
const selectedProjectIdForReq = ref(null)

const selectedProjectForReq = computed(() => {
    if (!selectedProjectIdForReq.value || !result.value) return null
    return result.value.projects.find(p => p.id === selectedProjectIdForReq.value)
})

const handleCreate = async () => {
  if (!form.value.name) return
  await createProject({ 
    name: form.value.name, 
    contractedHours: Number(form.value.contractedHours) 
  })
  form.value.name = ''
  form.value.contractedHours = 40
}

const startEdit = (project) => {
    editingId.value = project.id
    editForm.value = { 
        name: project.name,
        tag: project.tag, 
        contractedHours: project.contractedHours 
    }
}

const saveEdit = async () => {
    if (!editingId.value) return
    await updateProject({
        id: editingId.value,
        name: editForm.value.name,
        tag: editForm.value.tag,
        contractedHours: Number(editForm.value.contractedHours)
    })
    editingId.value = null
}

const openRequirements = (project) => {
    selectedProjectIdForReq.value = project.id
    requirementsModalOpen.value = true
}

const vacationModalOpen = ref(false)
const selectedProjectForVacation = ref(null)

const openVacations = (project) => {
    selectedProjectForVacation.value = project
    vacationModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <ProjectRequirementsModal 
        v-if="selectedProjectForReq"
        :isOpen="requirementsModalOpen" 
        :project="selectedProjectForReq"
        @close="requirementsModalOpen = false"
    />

    <ProjectVacationModal
        v-if="selectedProjectForVacation"
        :isOpen="vacationModalOpen"
        :project="selectedProjectForVacation"
        @close="vacationModalOpen = false"
    />
    
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4">
      <div class="flex-1 space-y-1">
        <label class="text-sm font-medium text-gray-700">Nombre del Proyecto</label>
        <input v-model="form.name" 
               type="text" 
               placeholder="ej. Rediseño Web" 
               class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
      <div class="w-48 space-y-1">
        <label class="text-sm font-medium text-gray-700">Horas Contratadas</label>
        <input v-model="form.contractedHours" 
               type="number" 
               min="0"
               class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
      <button @click="handleCreate" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mb-[1px]">
        <FolderPlus size="20" />
        Crear Proyecto
      </button>
    </div>

    <div v-if="loading">Cargando proyectos...</div>
    <div v-else-if="error" class="text-red-500">{{ error.message }}</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="project in result.projects" :key="project.id" 
           class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
        
        <div v-if="editingId !== project.id">
            <button @click="startEdit(project)" class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 size="16" />
            </button>
            <h3 class="text-lg font-bold text-gray-800 mb-2">{{ project.name }}</h3>
            <div class="flex items-center gap-2 text-gray-500 mb-4">
            <Clock size="16" />
            <span>{{ project.contractedHours }} hrs/sem</span>
            </div>
            
            <div class="border-t border-gray-100 pt-4 mt-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Requerimientos Técnicos
                    </h4>
                    <button @click="openRequirements(project)" class="text-blue-600 hover:text-blue-800 text-[10px] bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                        <SlidersHorizontal size="12" />
                        Gestionar
                    </button>
                </div>
            
                <div class="flex flex-wrap gap-2 mb-3" v-if="project.requiredRoles && project.requiredRoles.length > 0">
                    <div v-for="req in project.requiredRoles" :key="req.id" class="pl-2 pr-2 py-1 bg-purple-50 text-purple-700 rounded text-xs flex flex-wrap items-center gap-1 border border-purple-100">
                        <span class="font-bold">{{ req.role.name }}</span>
                        <span class="bg-purple-100 px-1 rounded text-[10px] text-purple-800 border border-purple-200">{{ req.resourceCount }}</span>
                        <span v-for="skill in req.skills" :key="skill.id" class="ml-1 text-[10px] px-1 py-0.5 bg-white border border-purple-100 text-gray-500 rounded">
                            {{ skill.name }}
                        </span>
                    </div>
                </div>
                <div class="text-sm text-gray-400 italic mb-3" v-else>Sin requerimientos de roles</div>
            </div>
            
             <div class="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <button @click="goToEstimation(project.id)" class="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition flex items-center justify-center gap-2">
                    <BarChart size="16" /> Estimación
                </button>
                <button @click="openVacations(project)" class="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2">
                    <Calendar size="16" /> Ver Calendario de Vacaciones
                </button>
            </div>
        </div>

        <div v-else class="space-y-4">
            <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Nombre</label>
                <input v-model="editForm.name" class="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Tag (URL)</label>
                <input v-model="editForm.tag" class="w-full border rounded px-2 py-1 text-sm" placeholder="PRO" />
            </div>
            <div class="space-y-1">
                <label class="text-xs font-bold text-gray-500">Horas</label>
                <input v-model="editForm.contractedHours" type="number" class="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <button @click="editingId = null" class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
                <button @click="saveEdit" class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Guardar</button>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>
