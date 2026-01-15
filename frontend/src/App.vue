<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SideNavigation from './components/SideNavigation.vue'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import { computed } from 'vue'
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const orgTag = computed(() => authStore.user?.organization?.tag)
</script>

<template>
  <div class="flex h-screen bg-gray-50 text-gray-900 font-sans">
    <SideNavigation />

    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>

    <ToastNotification />
    <ConfirmDialog />
  </div>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
}
</style>
