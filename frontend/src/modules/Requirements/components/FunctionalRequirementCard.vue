<script setup>
import { computed } from 'vue'
import { parseDateSafe } from '@/helper/Date'
import { getAvatarColor, getInitials, displayName as getDisplayName } from '@/helper/userDisplay'

const props = defineProps({
  requirement: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  DEPRECATED: 'bg-red-100 text-red-800'
}

const statusLabels = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'Pendiente de Revisión',
  VALIDATED: 'Validado',
  DEPRECATED: 'Deprecado'
}

const plainText = computed(() => {
  if (!props.requirement.description) return ''
  const div = document.createElement('div')
  div.innerHTML = props.requirement.description
  return div.textContent || div.innerText || ''
})

const truncatedDescription = computed(() => {
  const text = plainText.value
  return text.length > 150 ? text.substring(0, 150) + '...' : text
})

const uniqueEditors = computed(() => {
  const list = []
  const seen = new Set()
  if (!props.requirement.history) return list
  for (const h of props.requirement.history) {
    const u = h.changedBy
    if (u && typeof u.id === 'string' && !seen.has(u.id)) {
      seen.add(u.id)
      list.push(u)
    }
  }
  return list
})

const analysts = computed(() => uniqueEditors.value.slice(0, 3))
const editorsCount = computed(() => uniqueEditors.value.length)

const formattedDate = computed(() => {
  if (!props.requirement.updatedAt) return ''
  const date = parseDateSafe(props.requirement.updatedAt)
  return date ? date.format('DD/MM/YYYY') : ''
})

</script>

<template>
  <div
    class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
    @click="emit('edit')"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="font-bold text-lg text-gray-900">{{ requirement.title }}</h3>
        <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ truncatedDescription }}</p>
      </div>
      <span :class="['text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ml-4', statusColors[requirement.status]]">
        {{ statusLabels[requirement.status] }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <p class="text-gray-500">Versión</p>
        <p class="font-semibold">{{ requirement.version }}</p>
      </div>
      <div>
        <p class="text-gray-500">Paquetes de trabajo</p>
        <p class="font-semibold">{{ requirement.workPackages?.length || 0 }}</p>
      </div>
    </div>

    <div class="border-t pt-4 flex items-center justify-between">
      <div class="text-xs text-gray-500 flex-1">
        <div v-if="analysts.length > 0" class="flex items-center gap-2 mb-1">
          <span class="text-gray-400 text-xs">Editores:</span>
          <div class="flex gap-1">
            <div
              v-for="(user, idx) in analysts"
              :key="user.id || idx"
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              :style="{ backgroundColor: getAvatarColor(user) }"
              :title="`Editor: ${getDisplayName(user)}`"
            >
              {{ getInitials(user) }}
            </div>
            <span v-if="editorsCount > 3" class="text-gray-400 text-xs ml-1">+{{ editorsCount - 3 }}</span>
          </div>
        </div>
        <p v-else class="text-gray-400 mb-1">Sin ediciones</p>
        <p>{{ formattedDate }}</p>
      </div>
      <button
        @click.stop="emit('delete')"
        class="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0"
      >
        Eliminar
      </button>
    </div>
  </div>
</template>
