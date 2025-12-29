<script setup>
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'max-w-md' // max-w-sm | max-w-lg | max-w-xl | max-w-2xl
  }
})

const emit = defineEmits(['close'])

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div 
        class="bg-white rounded-xl shadow-2xl w-full relative flex flex-col max-h-[90vh]"
        :class="maxWidth"
      >
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl shrink-0">
          <h3 class="text-lg font-bold text-gray-800">
            <slot name="title">{{ title }}</slot>
          </h3>
          <button 
            @click="emit('close')"
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition"
          >
            <X :size="20" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <slot />
        </div>

        <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl shrink-0 flex justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div {
  transform: scale(0.95);
  opacity: 0;
}

.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
