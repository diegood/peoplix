<script setup>
import { computed } from 'vue'
import { Clock, MessageSquare, Move, Edit, Trash, CheckCircle } from 'lucide-vue-next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const props = defineProps({
    timeline: {
        type: Array,
        default: () => []
    }
})

const sortedTimeline = computed(() => {
    return [...props.timeline].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const getEventIcon = (type) => {
    switch (type) {
        case 'CREATED': return CheckCircle
        case 'MOVED': return Move
        case 'COMMENT_ADDED': return MessageSquare
        case 'COMMENT_EDITED': return Edit
        case 'COMMENT_DELETED': return Trash
        case 'UPDATED': return Edit
        default: return Clock
    }
}

const getEventColor = (type) => {
    switch (type) {
        case 'CREATED': return 'text-green-500 bg-green-50'
        case 'MOVED': return 'text-purple-500 bg-purple-50'
        case 'COMMENT_ADDED': return 'text-blue-500 bg-blue-50'
        case 'COMMENT_EDITED': return 'text-orange-500 bg-orange-50'
        case 'COMMENT_DELETED': return 'text-red-500 bg-red-50'
        default: return 'text-gray-500 bg-gray-50'
    }
}

const getEventLabel = (event) => {
    switch (event.type) {
        case 'CREATED': return 'Tarjeta creada'
        case 'MOVED': return 'Tarjeta movida' 
        case 'COMMENT_ADDED': return 'Comentario agregado'
        case 'COMMENT_EDITED': return 'Comentario editado'
        case 'COMMENT_DELETED': return 'Comentario eliminado'
        case 'UPDATED': return 'Tarjeta actualizada'
        case 'ASSIGNED': return 'Asignación cambiada'
        default: return 'Evento'
    }
}

const formatTime = (date) => dayjs(parseInt(date) || date).fromNow()
const formatFullDate = (date) => dayjs(parseInt(date) || date).format('D MMM YYYY, HH:mm')


const cleanDetails = (details) => {
    if (!details) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = details
    let text = tmp.textContent || tmp.innerText || ''
    
    text = text.replace(/^Comentario eliminado: "?/, '').replace(/"?$/, '')
    text = text.replace(/^Comentario editado: "?/, '').replace(/"?$/, '')
    
    return text
}



</script>

<template>
    <div class="space-y-4 p-4">
        <div v-if="sortedTimeline.length === 0" class="text-center text-gray-400 py-8 italic">
            No hay actividad registrada.
        </div>
        <div v-for="event in sortedTimeline" :key="event.id" class="flex gap-4 relative pb-4 last:pb-0">
            <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100 last:hidden"></div>

            <div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm" :class="getEventColor(event.type)">
                <component :is="getEventIcon(event.type)" size="14" />
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-900">
                             <span class="font-bold text-gray-700" v-if="event.author">
                                 {{ event.author.collaborator?.firstName || 'Usuario' }}
                             </span>
                             <span v-else class="italic text-gray-400">Sistema</span>
                             {{ getEventLabel(event).toLowerCase() }}
                        </p>
                        <div v-if="event.details && !['Comment added', 'Card details updated', 'Comment deleted'].includes(event.details)" class="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic line-clamp-3">
                             {{ cleanDetails(event.details) }}
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 whitespace-nowrap" :title="formatFullDate(event.createdAt)">
                        {{ formatTime(event.createdAt) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
