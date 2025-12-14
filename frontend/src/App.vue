<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Users, FolderKanban, BarChart3, Settings } from 'lucide-vue-next'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>

<template>
  <div class="flex h-screen bg-gray-50 text-gray-900 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-100 flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
        <span class="text-xl font-bold text-gray-800">Workload</span>
      </div>

      <nav class="flex-1 p-4 space-y-1">
          <RouterLink to="/" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <LayoutDashboard size="20" />
            <span>Panel</span>
          </RouterLink>

          <RouterLink to="/projects" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <FolderKanban size="20" />
            <span>Proyectos</span>
          </RouterLink>

          <RouterLink to="/collaborators" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <Users size="20" />
            <span>Colaboradores</span>
          </RouterLink>


          <RouterLink to="/settings" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors" exact-active-class="bg-purple-50 text-purple-600 font-medium">
            <Settings size="20" />
            <span>Configuración</span>
          </RouterLink>

          <RouterLink to="/stats" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <BarChart3 size="20" />
            <span>Estadísticas</span>
          </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-full bg-gray-200"></div>
           <div class="text-sm">
             <div class="font-medium text-gray-700">Admin User</div>
             <div class="text-gray-400 text-xs">admin@workload.com</div>
           </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>

    <!-- Global Notification Components -->
    <ToastNotification />
    <ConfirmDialog />
  </div>
</template>

<style>
/* Global resets if needed, but Tailwind handles most */
html, body {
  height: 100%;
  margin: 0;
}
</style>
