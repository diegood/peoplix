<script setup>
import { useNotificationStore } from '@/stores/notificationStore'
import { X } from 'lucide-vue-next'

const notificationStore = useNotificationStore()

const getTypeClasses = (type) => {
  const classes = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-amber-500 border-amber-600',
    info: 'bg-blue-500 border-blue-600'
  }
  return classes[type] || classes.info
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        :class="['pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white border-l-4 min-w-[300px] max-w-md', getTypeClasses(toast.type)]"
      >
        <div class="flex-1 text-sm font-medium">{{ toast.message }}</div>
        <button
          @click="notificationStore.removeToast(toast.id)"
          class="shrink-0 hover:bg-white/20 rounded p-1 transition"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
