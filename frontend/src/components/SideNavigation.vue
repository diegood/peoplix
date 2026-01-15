<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'
import OrgSelector from './OrgSelector.vue'
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  BarChart3, 
  Settings, 
  Calendar, 
  UserCog, 
  LogOut 
} from 'lucide-vue-next'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const orgTag = computed(() => authStore.user?.organization?.tag)

const hasPermission = (permission) => {
    if (!permission) return true
    if (permission === 'ADMIN') return isAdmin.value
    if (permission === 'SUPER_ADMIN') return authStore.isSuperAdmin
    return true
}

const mainItemsConfig = computed(() => [
  {
    label: 'Panel',
    to: `/${orgTag.value}/`,
    icon: LayoutDashboard,
    exactActiveClass: "bg-blue-50 text-blue-600 font-medium"
  },
  {
    label: 'Proyectos',
    to: `/${orgTag.value}/projects`,
    icon: FolderKanban
  },
  {
    label: 'Tablero Kanban',
    to: `/${orgTag.value}/kanban`,
    icon: LayoutDashboard
  },
  {
    label: 'Planificación',
    to: `/${orgTag.value}/planning`,
    icon: Calendar
  },
  {
    label: 'Colaboradores',
    to: `/${orgTag.value}/collaborators`,
    icon: Users
  }
])

const adminItemsConfig = [
  {
    label: 'Usuarios',
    to: '/admin/users',
    icon: UserCog,
    activeClass: "bg-purple-50 text-purple-600 font-medium",
    hoverClass: "hover:bg-purple-50 hover:text-purple-600",
    requiredPermission: 'ADMIN'
  },
  {
    label: 'Organizaciones',
    to: '/superadmin/organizations',
    icon: LayoutDashboard,
    activeClass: "bg-purple-50 text-purple-600 font-medium",
    hoverClass: "hover:bg-purple-50 hover:text-purple-600",
    requiredPermission: 'SUPER_ADMIN'
  }
]

const bottomItemsConfig = computed(() => [
    {
        label: 'Configuración',
        to: `/${orgTag.value}/settings`,
        icon: Settings,
        activeClass: "bg-gray-100 text-gray-900 font-medium",
        hoverClass: "hover:bg-gray-100/50 hover:text-gray-900",
        requiredPermission: 'ADMIN'
    },
    {
        label: 'Estadísticas',
        to: `/${orgTag.value}/stats`,
        icon: BarChart3,
        requiredPermission: 'ADMIN'
    }
])

const mainNavItems = computed(() => mainItemsConfig.value.filter(item => hasPermission(item.requiredPermission)))
const adminNavItems = computed(() => adminItemsConfig.filter(item => hasPermission(item.requiredPermission)))
const bottomNavItems = computed(() => bottomItemsConfig.value.filter(item => hasPermission(item.requiredPermission)))

</script>

<template>
    <aside v-if="authStore.isAuthenticated" class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-100 flex flex-col gap-4">
        <img src="@/assets/logo.png" alt="PEOPLIX" class="h-8 self-start">
        <OrgSelector />
      </div>

      <nav class="flex-1 p-4 space-y-1">
          <RouterLink 
            v-for="item in mainNavItems" 
            :key="item.to" 
            :to="item.to" 
            class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" 
            :exact-active-class="item.exactActiveClass || 'bg-blue-50 text-blue-600 font-medium'"
          >
            <component :is="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </RouterLink>

           <div v-if="adminNavItems.length" class="pt-4 pb-2">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Admin</div>
              <RouterLink 
                v-for="item in adminNavItems"
                :key="item.to"
                :to="item.to" 
                class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-colors" 
                :class="item.hoverClass"
                :exact-active-class="item.activeClass"
              >
                <component :is="item.icon" size="20" />
                <span>{{ item.label }}</span>
              </RouterLink>
           </div>

          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Organización</div>
          <RouterLink 
            v-for="item in bottomNavItems"
            :key="item.to"
            :to="item.to" 
            class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-colors mt-auto" 
            :class="item.hoverClass || 'hover:bg-blue-50 hover:text-blue-600'"
            :exact-active-class="item.activeClass || 'bg-blue-50 text-blue-600 font-medium'"
          >
            <component :is="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center justify-between group">
           <RouterLink :to="`/${orgTag}/profile`" class="flex items-center gap-3 flex-1 hover:bg-gray-50 p-2 rounded-lg transition">
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
</template>
