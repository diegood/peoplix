<script setup>
import { RouterView } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SideNavigation from './components/SideNavigation.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-50 text-gray-900 font-sans">
    <SideNavigation />

    <main class="flex-1 overflow-auto">
      <RouterView :key="$route.fullPath" />
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
