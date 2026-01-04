<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKanbanStore } from '../store/kanban.store'
import KanbanCard from '../components/KanbanCard.vue'
import CardDetailModal from '../components/CardDetailModal.vue'
import draggable from 'vuedraggable'
import { LayoutDashboard, Filter, ChevronDown, Check } from 'lucide-vue-next'
import { useQuery } from '@vue/apollo-composable'
import { GET_ME } from '@/graphql/queries'

const route = useRoute()
const router = useRouter()
const projectId = ref(route.params.id)
const store = useKanbanStore()

const { result: meResult } = useQuery(GET_ME)
const myProjects = computed(() => {
    const allocations = meResult.value?.me?.allocations || []
    const projects = []
    const seen = new Set()
    allocations.forEach(a => {
        if (a.project && !seen.has(a.project.id)) {
            seen.add(a.project.id)
            projects.push(a.project)
        }
    })
    return projects
})

const onlyMy = computed(() => {
    if (route.query.onlyMy !== undefined) {
        return route.query.onlyMy === 'true'
    }
    return !projectId.value
})

const toggleFilter = () => {
    const newVal = !onlyMy.value
    router.replace({ 
        query: { ...route.query, onlyMy: newVal } 
    })
}

watch(() => [route.params, route.query.onlyMy], ([params, queryOnlyMy]) => {
    const isMy = queryOnlyMy !== undefined ? queryOnlyMy === 'true' : undefined
    const context = { onlyMy: isMy }

    if (params.id) {
        if (params.id !== projectId.value || store.cards.length === 0 || queryOnlyMy !== undefined) {
            projectId.value = params.id
            context.projectId = params.id
            store.fetchBoard(context)
        }
    } else if (params.projectTag && params.orgTag) {
        context.projectTag = params.projectTag
        context.orgTag = params.orgTag
        store.fetchBoard(context)
        projectId.value = null
    } else {
        projectId.value = null
        store.fetchBoard(context)
    }
}, { immediate: true, deep: true })

const currentBoardName = computed(() => {
    if (projectId.value) {
        const p = myProjects.value.find(p => p.id === projectId.value)
        if (p) return p.name
        if (store.cards.length > 0 && store.cards[0].project) {
            return store.cards[0].project.name
        }
        return 'Tablero de Proyecto'
    }
    if (route.params.projectTag && route.params.orgTag) {
        const p = myProjects.value.find(
            p => p.tag === route.params.projectTag && p.organization?.tag === route.params.orgTag
        )
        if (p) return p.name
        
        if (store.cards.length > 0 && store.cards[0].project) {
            return store.cards[0].project.name
        }
        
        return `${route.params.projectTag}`
    }
    return 'Mi Tablero Global'
})

const isSwitcherOpen = ref(false)
const switchBoard = (project = null) => {
    isSwitcherOpen.value = false
    const query = { onlyMy: onlyMy.value ? 'true' : 'false' }
    
    if (project) {
        if (project.tag && project.organization?.tag) {
             router.push({ 
                 name: 'tagged-kanban-board', 
                 params: { orgTag: project.organization.tag, projectTag: project.tag },
                 query
             })
        } else {
             router.push({ name: 'project-kanban', params: { id: project.id }, query })
        }
    } else {
        router.push({ name: 'global-kanban', query: { onlyMy: 'true' } })
    }
}

const isCurrentProject = (project) => {
    if (!project) {
        return !projectId.value && !route.params.projectTag
    }
    if (projectId.value === project.id) return true
    if (project.tag === route.params.projectTag && project.organization?.tag === route.params.orgTag) return true
    return false
}

const selectedCard = ref(null)
const isModalOpen = ref(false)

watch(() => route.params.cardId, async (cardId) => {
    if (cardId) {
        isModalOpen.value = true
        const context = {
            projectTag: route.params.projectTag,
            orgTag: route.params.orgTag
        }
        const card = await store.fetchCard(cardId, context)
        if (card) {
            selectedCard.value = card
        } else {
            closeModal()
        }
    } else {
        selectedCard.value = null
        isModalOpen.value = false
    }
}, { immediate: true })

const openCard = (card) => {
    const paramId = card.readableId || card.id
    
    if (card.project?.tag && card.project?.organization?.tag) {
         router.push({ 
             name: 'tagged-kanban-card', 
             params: { 
                 orgTag: card.project.organization.tag,
                 projectTag: card.project.tag,
                 cardId: paramId 
             } 
         })
    } else if (projectId.value) {
        router.push({ name: 'project-kanban-card', params: { id: projectId.value, cardId: paramId } })
    } else {
        router.push({ name: 'global-kanban-card', params: { cardId: paramId } })
    }
}

const closeModal = () => {
    const query = { ...route.query }
    
    if (route.name === 'tagged-kanban-card') {
        const { orgTag, projectTag } = route.params
        if (orgTag && projectTag) {
             router.push({ 
                 name: 'tagged-kanban-board', 
                 params: { orgTag, projectTag },
                 query
             })
        } else {
             router.push({ name: 'global-kanban', query })
        }
    } else if (projectId.value) {
        router.push({ name: 'project-kanban', params: { id: projectId.value }, query })
    } else {
        router.push({ name: 'global-kanban', query })
    }
}

const columns = [
    { id: 'todo', label: 'Por hacer', color: 'border-t-red-500' },
    { id: 'in_progress', label: 'En progreso', color: 'border-t-blue-500' },
    { id: 'review', label: 'En revisión', color: 'border-t-yellow-500' },
    { id: 'done', label: 'Hecho', color: 'border-t-green-500' }
]

const columnsData = ref({
    todo: [],
    in_progress: [],
    review: [],
    done: []
})

const searchQuery = ref('')

watch(() => [store.cards, searchQuery.value], ([newCards, query]) => {
    let filtered = newCards
    if (query) {
        const q = query.toLowerCase()
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(q) || 
            c.readableId.toLowerCase().includes(q)
        )
    }

    columnsData.value.todo = filtered.filter(c => c.status === 'todo')
    columnsData.value.in_progress = filtered.filter(c => c.status === 'in_progress')
    columnsData.value.review = filtered.filter(c => c.status === 'review')
    columnsData.value.done = filtered.filter(c => c.status === 'done')
}, { immediate: true, deep: true })

const onDragChange = (evt, newStatus) => {
    if (evt.added) {
        const card = evt.added.element
        store.moveCard(card.id, newStatus)
    }
}
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50">
        <header class="bg-white border-b px-6 py-3 flex justify-between items-center z-20 relative">
             <div class="flex items-center gap-2">
                 <LayoutDashboard class="w-5 h-5 text-gray-500" />
                 
                 <div class="relative">
                     <button @click="isSwitcherOpen = !isSwitcherOpen" class="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-50">
                         {{ currentBoardName }}
                         <ChevronDown size="16" class="text-gray-400" :class="{'rotate-180': isSwitcherOpen}" />
                     </button>
                     
                     <div v-if="isSwitcherOpen" class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-100">
                         <div class="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Cambiar Tablero</div>
                         
                         <button @click="switchBoard(null)" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group">
                             <span :class="{'text-blue-600 font-medium': isCurrentProject(null), 'text-gray-700': !isCurrentProject(null)}">Mi Tablero Global</span>
                             <Check v-if="isCurrentProject(null)" size="14" class="text-blue-600" />
                         </button>
                         
                         <div class="h-px bg-gray-100 my-2"></div>
                         
                         <div class="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Mis Proyectos</div>
                         <div class="max-h-64 overflow-y-auto">
                             <button 
                                 v-for="proj in myProjects" 
                                 :key="proj.id" 
                                 @click="switchBoard(proj)" 
                                 class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                             >
                                 <span :class="{'text-blue-600 font-medium': isCurrentProject(proj), 'text-gray-700': !isCurrentProject(proj)}">{{ proj.name }}</span>
                                 <Check v-if="isCurrentProject(proj)" size="14" class="text-blue-600" />
                             </button>
                             
                             <div v-if="myProjects.length === 0" class="px-4 py-2 text-sm text-gray-400 italic">
                                 No participas en proyectos
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 <div v-if="isSwitcherOpen" class="fixed inset-0 z-[-1]" @click="isSwitcherOpen = false"></div>
             </div>
             
             <div class="flex items-center gap-3">
                 <div class="relative">
                     <input 
                        v-model="searchQuery"
                        placeholder="Buscar..." 
                        class="pl-8 pr-4 py-1.5 text-sm border-gray-200 rounded bg-gray-100 focus:bg-white focus:ring-2 ring-blue-500 outline-none w-64 transition-all"
                     />
                     <Filter class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                 </div>
                 
                 <button 
                    @click="toggleFilter"
                    :class="['flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors', onlyMy ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 bg-gray-100 hover:bg-gray-200']"
                 >
                     <Filter class="w-4 h-4" />
                     {{ onlyMy ? 'Mis Tareas' : 'Todas' }}
                 </button>
             </div>
        </header>

        <div class="flex-1 overflow-x-auto p-6">
            <div class="flex gap-6 h-full min-w-max">
                <div v-for="col in columns" :key="col.id" class="w-72 flex flex-col bg-gray-100 rounded-lg p-2 max-h-full">
                    <div :class="['p-3 font-semibold text-gray-700 bg-white rounded shadow-sm mb-3 border-t-4', col.color]">
                        {{ col.label }} <span class="text-gray-400 text-sm ml-1">({{ columnsData[col.id].length }})</span>
                    </div>
                    
                    <draggable 
                        v-model="columnsData[col.id]" 
                        group="kanban" 
                        item-key="id"
                        class="flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                        @change="(e) => onDragChange(e, col.id)">
                        <template #item="{ element }">
                             <div @click="openCard(element)" class="kanban-card">
                                <KanbanCard :card="element" />
                             </div>
                        </template>
                    </draggable>
                </div>
            </div>
        </div>
        
        <CardDetailModal 
            v-if="selectedCard"
            :isOpen="isModalOpen"
            :card="selectedCard"
            @close="closeModal"
            @open-card="openCard"
        />
    </div>
</template>
