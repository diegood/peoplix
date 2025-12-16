<script setup>
import { useNotificationStore } from '@/stores/notificationStore'
import { onMounted, onUnmounted } from 'vue'

const notificationStore = useNotificationStore()

const handleConfirm = () => {
  notificationStore.closeDialog(true)
}

const handleCancel = () => {
  notificationStore.closeDialog(false)
}

const handleKeydown = (e) => {
  if (!notificationStore.dialog) return
  
  if (e.key === 'Enter') {
    handleConfirm()
  } else if (e.key === 'Escape') {
    handleCancel()
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
  <Transition name="dialog">
    <div
      v-if="notificationStore.dialog"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 class="text-lg font-bold text-gray-800">
            {{ notificationStore.dialog.title }}
          </h3>
        </div>

        <div class="px-6 py-6">
          <p class="text-gray-700 leading-relaxed">
            {{ notificationStore.dialog.message }}
          </p>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="handleCancel"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active > div,
.dialog-leave-active > div {
  transition: transform 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from > div {
  transform: scale(0.95);
}

.dialog-leave-to > div {
  transform: scale(0.95);
}
</style>
