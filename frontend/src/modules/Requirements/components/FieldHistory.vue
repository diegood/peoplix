<script setup>
import { ref, computed } from 'vue'
import { parseDateSafe } from '@/helper/Date'
import { getInitials, getAvatarColor, displayName } from '@/helper/userDisplay'
import HistoryComparison from '@/modules/Requirements/components/HistoryComparison.vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  currentValue: {
    type: [String, Number, Object, null],
    default: ''
  },
  label: {
    type: String,
    default: 'Campo'
  },
  minHeight: {
    type: Number,
    default: 60
  }
})

const emit = defineEmits(['revert'])

const showHistory = ref(false)
const comparePrevious = ref(false)
const compareEntry = ref({})

const latest = computed(() => props.history?.[0] || null)
const previous = computed(() => props.history?.[1] || null)

const formatWhen = (when) => (when ? parseDateSafe(when)?.format('DD/MM/YYYY HH:mm') || '' : '')

const toPlainText = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    const el = document.createElement('div')
    el.innerHTML = value
    return el.textContent || el.innerText || ''
  }
  if (typeof value === 'number') return String(value)
  return ''
}

const toggleEntryCompare = (id) => {
  compareEntry.value = { ...compareEntry.value, [id]: !compareEntry.value[id] }
}

const revertTo = (entry) => emit('revert', entry)
</script>

<template>
  <div class="space-y-3">
    <div v-if="latest" class="flex items-center gap-2 text-xs text-gray-600">
      <span
        :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold']"
        :style="{ backgroundColor: getAvatarColor(latest.who) }"
      >
        {{ getInitials(latest.who) }}
      </span>
      <span class="hidden sm:inline">Último cambio por {{ displayName(latest.who) }}</span>
      <span class="text-gray-400">·</span>
      <span>{{ formatWhen(latest.when) }}</span>
      <button
        v-if="previous"
        class="text-blue-600 hover:underline"
        @click.prevent="comparePrevious = !comparePrevious"
      >
        {{ comparePrevious ? 'Ocultar comparación con anterior' : 'Comparar con anterior' }}
      </button>
      <button
        v-if="history.length"
        class="text-blue-600 hover:underline"
        @click.prevent="showHistory = !showHistory"
      >
        {{ showHistory ? 'Ocultar historial' : 'Ver historial' }}
      </button>
    </div>

    <div v-if="comparePrevious && previous" class="bg-gray-50 rounded-lg p-3 text-xs text-gray-700">
      <HistoryComparison
        left-label="Anterior"
        right-label="Actual"
        :left-value="toPlainText(previous.value)"
        :right-value="toPlainText(currentValue)"
        :min-height="minHeight"
      />
    </div>

    <div v-if="showHistory && history.length" class="pt-3 border-t border-gray-200 space-y-3">
      <div class="text-xs font-semibold text-gray-600">Histórico {{ label ? `(${label})` : '' }}</div>
      <div
        v-for="(h, idx) in history"
        :key="h.id"
        class="rounded-lg p-3 text-xs text-gray-700 space-y-2"
      >
        <div class="flex items-center gap-2">
          <span
            :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold']"
            :style="{ backgroundColor: getAvatarColor(h.who) }"
          >
            {{ getInitials(h.who) }}
          </span>
          <div class="flex-1">
            <div class="font-semibold">{{ displayName(h.who) }}</div>
            <div class="text-gray-500">{{ formatWhen(h.when) }}</div>
          </div>
          <button class="text-blue-600 hover:underline" @click.prevent="revertTo(h)">Revertir</button>
        </div>

        <div v-if="!(idx === 0 && comparePrevious && previous) && !compareEntry[h.id]" class="rounded p-2 bg-gray-50" :style="{ minHeight: `${minHeight}px` }">
          {{ toPlainText(h.value) || 'Vacío' }}
        </div>

        <div class="flex items-center gap-2 text-[11px] text-blue-600">
          <button
            v-if="idx === 0 && previous"
            class="hover:underline"
            @click.prevent="comparePrevious = !comparePrevious"
          >
            {{ comparePrevious ? 'Ocultar comparación con anterior' : 'Comparar con anterior' }}
          </button>
          <button class="hover:underline" @click.prevent="toggleEntryCompare(h.id)">
            {{ compareEntry[h.id] ? 'Ocultar comparación con actual' : 'Comparar con actual' }}
          </button>
        </div>

        <div v-if="(idx === 0 && comparePrevious && previous) || compareEntry[h.id]" class="text-[11px] text-gray-500">
          <div class="mt-1">
            <HistoryComparison
              :left-label="comparePrevious && idx === 0 ? 'Anterior' : 'Histórico'"
              right-label="Actual"
              :left-value="toPlainText(comparePrevious && idx === 0 ? previous.value : h.value)"
              :right-value="toPlainText(currentValue)"
              :min-height="minHeight"
              left-class="bg-white"
              right-class="bg-blue-50"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
