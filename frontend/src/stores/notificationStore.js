import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref([])
  const dialog = ref(null)
  
  // Toast methods
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type, duration })
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }
  
  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  
  // Dialog methods (Promise-based for async/await usage)
  const showDialog = (message, title = 'Confirmar') => {
    return new Promise((resolve) => {
      dialog.value = { message, title, resolve }
    })
  }
  
  const closeDialog = (confirmed) => {
    if (dialog.value) {
      dialog.value.resolve(confirmed)
      dialog.value = null
    }
  }
  
  return {
    toasts,
    dialog,
    showToast,
    removeToast,
    showDialog,
    closeDialog
  }
})
