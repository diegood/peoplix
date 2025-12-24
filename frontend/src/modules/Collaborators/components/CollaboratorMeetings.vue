<script setup>
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { 
    ADD_COLLABORATOR_MEETING, 
    DELETE_COLLABORATOR_MEETING,
    ADD_MEETING_ACTION_ITEM,
    UPDATE_MEETING_ACTION_ITEM,
    DELETE_MEETING_ACTION_ITEM 
} from '../graphql/collaborator.queries'
import { Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, Download, ExternalLink, Calendar } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
    meetings: { type: Array, default: () => [] },
    collaboratorId: { type: String, required: true },
    collaboratorName: { type: String, default: 'Consultor' }
})
const emit = defineEmits(['refetch'])
const notificationStore = useNotificationStore()

const showAddForm = ref(false)
const newMeeting = ref({
    date: new Date().toISOString().split('T')[0],
    notes: ''
})
const expandedMeetingId = ref(null)
const newActionItem = ref({})

const { mutate: addMeeting, loading: creatingMeeting } = useMutation(ADD_COLLABORATOR_MEETING)
const { mutate: deleteMeeting } = useMutation(DELETE_COLLABORATOR_MEETING)
const { mutate: addActionItem } = useMutation(ADD_MEETING_ACTION_ITEM)
const { mutate: updateActionItem } = useMutation(UPDATE_MEETING_ACTION_ITEM)
const { mutate: deleteActionItem } = useMutation(DELETE_MEETING_ACTION_ITEM)

const toggleExpand = (id) => {
    expandedMeetingId.value = expandedMeetingId.value === id ? null : id
}

const handleAddMeeting = async () => {
    if (!newMeeting.value.date) return
    try {
        await addMeeting({
            collaboratorId: props.collaboratorId,
            date: new Date(newMeeting.value.date).toISOString(),
            notes: newMeeting.value.notes
        })
        notificationStore.showToast('Reunión agendada', 'success')
        newMeeting.value = { date: new Date().toISOString().split('T')[0], notes: '' }
        showAddForm.value = false
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const handleRemoveMeeting = async (id) => {
    if (!confirm('¿Eliminar esta reunión y todos sus datos?')) return
    try {
        await deleteMeeting({ id })
        notificationStore.showToast('Reunión eliminada', 'success')
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const handleAddActionItem = async (meetingId) => {
    const text = newActionItem.value[meetingId]
    if (!text) return
    try {
        await addActionItem({
            meetingId,
            description: text
        })
        newActionItem.value[meetingId] = ''
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const handleToggleActionItem = async (item) => {
    try {
        await updateActionItem({
            id: item.id,
            status: item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
        })
        emit('refetch')
    } catch (err) {
        notificationStore.showToast(err.message, 'error')
    }
}

const handleDeleteActionItem = async (id) => {
    try {
        await deleteActionItem({ id })
        emit('refetch')
    } catch (err) {
         notificationStore.showToast(err.message, 'error')
    }
}

const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('es-ES', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
}

const downloadIcs = (meeting) => {
  const title = `Reunión: ${props.collaboratorName}`
  const desc = meeting.notes || "Reunión de seguimiento."
  const dateStr = new Date(meeting.date).toISOString().replace(/-/g, '').split('T')[0] // YYYYMMDD
  
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`, 
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `meeting-${dateStr}.ics`
  link.click()
}

const openGoogleCalendar = (meeting) => {
    const title = encodeURIComponent(`Reunión: ${props.collaboratorName}`)
    const desc = encodeURIComponent(meeting.notes || "Reunión de seguimiento.")
    const dateStr = new Date(meeting.date).toISOString().replace(/-/g, '').split('T')[0]
    const dates = `${dateStr}/${dateStr}`
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${desc}&dates=${dates}`
    window.open(url, '_blank')
}

</script>

<template>
  <div class="space-y-6">
      <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
             <div class="p-2 bg-orange-50 text-orange-600 rounded-lg"><Calendar size="20" /></div>
             <h3 class="text-lg font-bold text-gray-800">Reuniones de Seguimiento</h3>
          </div>
          
          <button v-if="!showAddForm" @click="showAddForm = true" class="text-sm flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
              <Plus size="16" /> Agendar
          </button>
      </div>

      <div v-if="showAddForm" class="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-in slide-in-from-top-2">
          <h4 class="font-bold text-gray-700 mb-3 text-sm">Nueva Reunión de Seguimiento</h4>
          <div class="space-y-4">
              <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
                  <input v-model="newMeeting.date" type="date" class="w-full text-sm border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2" />
              </div>
              <div>
                   <label class="block text-xs font-medium text-gray-500 mb-1">Notas / Agenda</label>
                   <textarea v-model="newMeeting.notes" rows="3" class="w-full text-sm border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2 placeholder-gray-400" placeholder="Temas a tratar..."></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                  <button @click="showAddForm = false" class="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm">Cancelar</button>
                  <button @click="handleAddMeeting" :disabled="creatingMeeting || !newMeeting.date" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                      {{ creatingMeeting ? 'Guardando...' : 'Agendar' }}
                  </button>
              </div>
          </div>
      </div>

      <div class="space-y-4">
          <div v-for="meeting in meetings" :key="meeting.id" class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md">
              <div 
                @click="toggleExpand(meeting.id)"
                class="flex items-center justify-between p-4 cursor-pointer bg-white hover:bg-gray-50 transition-colors select-none"
              >
                  <div class="flex items-center gap-4">
                      <div class="flex flex-col items-center justify-center bg-orange-100 text-orange-700 w-12 h-12 rounded-lg border border-orange-200">
                          <span class="text-xs font-bold uppercase">{{ new Date(meeting.date).toLocaleString('es-ES', { month: 'short' }) }}</span>
                          <span class="text-lg font-bold">{{ new Date(meeting.date).getDate() }}</span>
                      </div>
                      <div>
                          <h4 class="font-bold text-gray-800">{{ formatDate(meeting.date) }}</h4>
                          <span class="text-xs text-gray-500">{{ meeting.actionItems.filter(i => i.status === 'PENDING').length }} pendientes</span>
                      </div>
                  </div>
                  <div class="flex items-center gap-3">
                       <button @click.stop="handleRemoveMeeting(meeting.id)" class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                           <Trash2 size="16" />
                       </button>

                       <div class="flex items-center gap-1 border-l border-gray-200 pl-3">
                           <button @click.stop="openGoogleCalendar(meeting)" class="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Google Calendar">
                               <ExternalLink size="16" />
                           </button>
                           <button @click.stop="downloadIcs(meeting)" class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors" title="Descargar .ics (Outlook/iCal)">
                               <Download size="16" />
                           </button>
                       </div>

                       <component :is="expandedMeetingId === meeting.id ? ChevronUp : ChevronDown" class="text-gray-400" size="20" />

                  </div>
              </div>

              <div v-if="expandedMeetingId === meeting.id" class="border-t border-gray-100 bg-gray-50/30 p-4 space-y-6 animate-in slide-in-from-top-1">
                  <div v-if="meeting.notes">
                      <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notas de la reunión</h5>
                      <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ meeting.notes }}</p>
                  </div>

                  <div>
                      <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                          Action Items / Objetivos
                          <span class="text-[10px] font-normal bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{{ meeting.actionItems.length }} items</span>
                      </h5>
                      
                      <div class="space-y-2 mb-3">
                          <div v-for="item in meeting.actionItems" :key="item.id" class="flex items-start gap-3 group">
                              <button @click="handleToggleActionItem(item)" class="pt-0.5 text-gray-400 hover:text-orange-600 transition-colors">
                                  <CheckCircle v-if="item.status === 'COMPLETED'" class="text-green-500" size="18" />
                                  <Circle v-else size="18" />
                              </button>
                              <span 
                                class="text-sm flex-1 transition-all duration-200"
                                :class="item.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-700'"
                              >
                                  {{ item.description }}
                              </span>
                              <button @click="handleDeleteActionItem(item.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size="14" />
                              </button>
                          </div>
                      </div>

                      <div class="flex gap-2">
                          <input 
                            v-model="newActionItem[meeting.id]" 
                            @keydown.enter="handleAddActionItem(meeting.id)"
                            type="text" 
                            placeholder="Nuevo item (Enter para guardar)..." 
                            class="flex-1 text-sm border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white"
                          />
                          <button @click="handleAddActionItem(meeting.id)" class="bg-white border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-200 p-2 rounded-lg transition-colors">
                              <Plus size="18" />
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <div v-if="meetings.length === 0" class="text-center text-gray-400 py-12 border-2 border-dashed border-gray-100 rounded-xl">
               No hay reuniones registradas.
          </div>
      </div>
  </div>
</template>
