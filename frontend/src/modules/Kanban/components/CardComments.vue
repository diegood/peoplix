<script setup>
import { ref, computed } from 'vue'
import { Send } from 'lucide-vue-next'
import { useKanbanStore } from '../store/kanban.store'

import TiptapEditor from './TiptapEditor.vue'

const props = defineProps({
    cardId: {
        type: String,
        required: true
    },
    comments: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['added'])

const store = useKanbanStore()
const newComment = ref('')
const isSubmitting = ref(false)

const sortedComments = computed(() => {
    return [...props.comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const handleAddComment = async () => {
    if (!newComment.value || newComment.value === '<p></p>') return

    isSubmitting.value = true
    try {
        const addedComment = await store.addComment(props.cardId, newComment.value)
        emit('added', addedComment)
        newComment.value = ''
    } catch (e) {
        console.error(e)
        alert('Error al agregar comentario')
    } finally {
        isSubmitting.value = false
    }
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(parseInt(dateString)).toLocaleString()
}
</script>

<template>
    <div class="mt-8">
        <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            Comentarios ({{ comments.length }})
        </h3>
        
        <div class="flex gap-3 mb-6">
            <div class="flex-1">
                <div class="relative min-h-[80px]">
                    <TiptapEditor 
                        v-model="newComment" 
                        menu-type="bubble"
                        placeholder="Escribe un comentario..."
                        @keydown.ctrl.enter="handleAddComment"
                    />
                    <button 
                        @click="handleAddComment" 
                        :disabled="!newComment || newComment === '<p></p>' || isSubmitting"
                        class="absolute bottom-3 right-3 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors z-10 bg-white shadow-sm p-1 rounded-full"
                        title="Enviar (Ctrl+Enter)"
                    >
                        <Send size="18" />
                    </button>
                </div>
                <!-- <p class="text-xs text-gray-400 mt-1 text-right">Ctrl + Enter para enviar</p> -->
            </div>
        </div>

        <div class="space-y-6">
            <div v-if="comments.length === 0" class="text-center py-6 text-gray-400 text-sm italic">
                No hay comentarios aún.
            </div>
            <div v-for="comment in sortedComments" :key="comment.id" class="flex gap-3 group">
                 <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0 overflow-hidden">
                    <img v-if="comment.author?.collaborator?.avatar" :src="comment.author.collaborator.avatar" class="w-full h-full object-cover">
                    <span v-else class="text-xs font-bold">
                        {{ comment.author?.collaborator?.firstName?.[0] || '?' }}
                    </span>
                 </div>
                 <div class="flex-1">
                     <div class="flex items-center gap-2 mb-1">
                         <span class="font-medium text-sm text-gray-900">
                             {{ comment.author?.collaborator?.firstName }} {{ comment.author?.collaborator?.lastName }}
                         </span>
                         <span class="text-xs text-gray-400">
                             {{ formatDate(comment.createdAt) }}
                         </span>
                     </div>
                     <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors prose prose-sm max-w-none" v-html="comment.content"></div>
                 </div>
            </div>
        </div>
    </div>
</template>
