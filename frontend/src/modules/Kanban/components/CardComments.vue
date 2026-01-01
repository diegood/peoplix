<script setup>
import { ref, computed } from 'vue'
import { Send, Reply, Smile, Pencil, Clock } from 'lucide-vue-next'
import { useKanbanStore } from '../store/kanban.store'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

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

const timeAgo = (date) => !date ? '' : (dayjs(parseInt(date)) || dayjs(date)).fromNow()

const handleQuote = (comment) => {
    const quote = `<blockquote>${comment.content}</blockquote><p></p>`
    newComment.value = quote + newComment.value
}

const emojiOptions = ['👍', '❤️', '😂', '😮', '😢', '🚀']
const activeReactionCommentId = ref(null)

const toggleReactionMenu = (commentId) => {
    if (activeReactionCommentId.value === commentId) {
        activeReactionCommentId.value = null
    } else {
        activeReactionCommentId.value = commentId
    }
}

const addReaction = async (comment, emoji) => {
    activeReactionCommentId.value = null
    try {
        await store.addReaction(comment.id, emoji)
    } catch (e) {
        console.error(e)
    }
}

const getGroupedReactions = (reactions) => {
    if (!reactions) return {}
    const groups = {}
    reactions.forEach(r => {
        if (!groups[r.emoji]) groups[r.emoji] = []
        groups[r.emoji].push(r)
    })
    return groups
}

const authStore = useAuthStore()
const editingCommentId = ref(null)
const editingContent = ref('')
const historyComment = ref(null)

const canEdit = (comment) => {
    if (!authStore.user) return false
    const isAdmin = authStore.user.systemRole === 1
    const isAuthor = comment.author?.collaborator?.id === authStore.user.id
    return isAdmin || isAuthor
}

const startEditing = (comment) => {
    editingCommentId.value = comment.id
    editingContent.value = comment.content
}

const cancelEditing = () => {
    editingCommentId.value = null
    editingContent.value = ''
}

const saveEdit = async (commentId) => {
    if (!editingContent.value || editingContent.value === '<p></p>') return
    
    try {
        await store.editComment(commentId, editingContent.value)
        editingCommentId.value = null
        editingContent.value = ''
    } catch {
        alert('Error al editar comentario')
    }
}

const openHistory = (comment) => {
    historyComment.value = comment
}

const closeHistory = () => {
    historyComment.value = null
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
                     <div class="flex items-center justify-between mb-1">
                         <span class="font-medium text-sm text-gray-900">
                             {{ comment.author?.collaborator?.firstName }} {{ comment.author?.collaborator?.lastName }}
                         </span>
                         <div class="flex items-center gap-2 text-xs text-gray-400">
                             <button v-if="comment.history && comment.history.length > 0" @click="openHistory(comment)" class="hover:text-blue-600 flex items-center gap-0.5" title="Ver historial">
                                 <Clock size="10" />
                                 (editado)
                             </button>
                             <span :title="formatDate(comment.createdAt)">
                                 {{ timeAgo(comment.createdAt) }}
                             </span>
                         </div>
                     </div>
                      <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors prose prose-sm max-w-none relative pr-8">
                          
                          <div v-if="editingCommentId === comment.id">
                              <TiptapEditor v-model="editingContent" menu-type="bubble" class="bg-white border rounded" />
                              <div class="flex justify-end gap-2 mt-2">
                                  <button @click="cancelEditing" class="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                  <button @click="saveEdit(comment.id)" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Guardar</button>
                              </div>
                          </div>
                          <div v-else>
                              <div v-html="comment.content"></div>
                          </div>
                          
                          <div v-if="editingCommentId !== comment.id" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button @click="handleQuote(comment)" class="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded" title="Citar">
                                  <Reply size="14" />
                              </button>
                              <button v-if="canEdit(comment)" @click="startEditing(comment)" class="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded" title="Editar">
                                  <Pencil size="14" />
                              </button>
                          </div>
                      </div>

                     <div class="flex flex-wrap gap-1 mt-1 ml-1 items-center">
                         <button 
                            v-for="(group, emoji) in getGroupedReactions(comment.reactions)" 
                            :key="emoji"
                            @click="addReaction(comment, emoji)"
                            class="text-xs bg-gray-100 hover:bg-gray-200 border border-transparent hover:border-gray-300 rounded-full px-1.5 py-0.5 flex items-center gap-1 transition-colors"
                            :title="group.map(r => r.user?.collaborator?.firstName).join(', ')"
                         >
                             <span>{{ emoji }}</span>
                             <span class="text-gray-500 font-medium">{{ group.length }}</span>
                         </button>

                         <div class="relative">
                             <button 
                                @click="toggleReactionMenu(comment.id)" 
                                class="text-xs bg-gray-50 hover:bg-gray-200 border border-transparent rounded-full p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                :class="{ 'opacity-100': activeReactionCommentId === comment.id || (comment.reactions && comment.reactions.length > 0) }"
                                title="Reaccionar"
                             >
                                 <Smile size="14" />
                             </button>

                             <div v-if="activeReactionCommentId === comment.id" class="absolute left-0 top-full mt-1 bg-white shadow-lg border rounded-lg p-2 flex gap-1 z-20">
                                 <button 
                                    v-for="emoji in emojiOptions" 
                                    :key="emoji"
                                    @click="addReaction(comment, emoji)"
                                    class="hover:bg-gray-100 p-1 rounded text-lg leading-none"
                                 >
                                     {{ emoji }}
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- History Modal -->
    <div v-if="historyComment" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="closeHistory">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h3 class="font-bold text-gray-700">Historial de edición</h3>
                <button @click="closeHistory" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div class="p-4 overflow-y-auto space-y-4">
                <div v-for="version in historyComment.history" :key="version.id" class="border-b pb-4 last:border-0 last:pb-0">
                     <div class="flex items-center gap-2 mb-2">
                         <img v-if="version.author?.collaborator?.avatar" :src="version.author.collaborator.avatar" class="w-6 h-6 rounded-full">
                         <div v-else class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                             {{ version.author?.collaborator?.firstName?.[0] || '?' }}
                         </div>
                         <div class="text-xs text-gray-500">
                             <span class="font-bold text-gray-700">{{ version.author?.collaborator?.firstName }}</span>
                             <span class="mx-1">•</span>
                             {{ formatDate(version.createdAt) }}
                         </div>
                     </div>
                     <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded prose prose-sm" v-html="version.content"></div>
                </div>
                <div v-if="!historyComment.history || historyComment.history.length === 0" class="text-center text-gray-400 italic">
                    No hay historial disponible.
                </div>
            </div>
        </div>
    </div>
</template>
