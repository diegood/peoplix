import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue')
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/collaborators',
      name: 'collaborators',
      component: () => import('@/modules/Collaborators/views/CollaboratorsView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/planning',
      name: 'planning',
      component: () => import('@/views/MonthlyPlanningView.vue')
    },
    {
      path: '/projects/:id/estimation',
      name: 'project-estimation',
      component: () => import('@/modules/Allocations/views/ProjectEstimationView.vue')
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/AdminUsersView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    }
  ],
})

router.beforeEach(async (to, from, next) => {
  // We need to use store inside the guard (pinia is installed)
  const authStore = useAuthStore()
  
  const isPublic = to.meta.public
  const isAuthenticated = authStore.isAuthenticated

  if (!isPublic && !isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.name === 'login' && isAuthenticated) {
    return next({ name: 'dashboard' })
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
      // Redirect to dashboard if trying to access admin route as non-admin
      return next({ name: 'dashboard' })
  }

  next()
})

export default router
