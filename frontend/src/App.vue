<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Users, FolderKanban, BarChart3, Settings, Calendar, UserCog, LogOut } from 'lucide-vue-next'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useAuthStore } from './stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
</script>

<template>
  <div class="flex h-screen bg-gray-50 text-gray-900 font-sans">
    <aside v-if="authStore.isAuthenticated" class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-100 flex items-center gap-2">
        <img src="@/assets/logo.png" alt="PEOPLIX" class="h-8">
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

          <RouterLink to="/planning" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <Calendar size="20" />
            <span>Planificación</span>
          </RouterLink>

          <RouterLink to="/collaborators" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <Users size="20" />
            <span>Colaboradores</span>
          </RouterLink>

           <div v-if="isAdmin" class="pt-4 pb-2">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Admin</div>
              <RouterLink to="/admin/users" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors" exact-active-class="bg-purple-50 text-purple-600 font-medium">
                <UserCog size="20" />
                <span>Usuarios</span>
              </RouterLink>
           </div>

          <RouterLink to="/settings" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 rounded-lg transition-colors mt-auto" exact-active-class="bg-gray-100 text-gray-900 font-medium">
            <Settings size="20" />
            <span>Configuración</span>
          </RouterLink>

          <RouterLink to="/stats" class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" exact-active-class="bg-blue-50 text-blue-600 font-medium">
            <BarChart3 size="20" />
            <span>Estadísticas</span>
          </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center justify-between group">
           <RouterLink to="/profile" class="flex items-center gap-3 flex-1 hover:bg-gray-50 p-2 rounded-lg transition">
               <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs"> 
                  {{ user?.firstName?.[0] || 'U' }}{{ user?.lastName?.[0] || 'U' }} 
               </div>
               <div class="text-sm overflow-hidden">
                 <div class="font-medium text-gray-700 truncate">{{ user?.firstName }} {{ user?.lastName }}</div>
                 <div class="text-gray-400 text-xs truncate">@{{ user?.userName }}</div>
               </div>
           </RouterLink>
           <button @click="authStore.logout()" class="p-2 text-gray-400 hover:text-red-600 transition" title="Logout">
              <LogOut size="18" />
           </button>
        </div>
      </div>
    </aside>

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
