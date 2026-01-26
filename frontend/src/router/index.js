import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/Auth/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/Auth/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/views/UnauthorizedView.vue')
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/AdminUsersView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/:orgTag/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/superadmin/organizations',
      name: 'superadmin-organizations',
      component: () => import('@/modules/SuperAdmin/views/OrganizationsView.vue'),
    },
    {
      path: '/create-org',
      name: 'create-org',
      component: () => import('@/modules/Onboarding/views/CreateOrgView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      name: 'root',
      redirect: () => {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
            // Check if user has an active organization profile
            if (authStore.user?.organization?.tag) {
                return { path: `/${authStore.user.organization.tag}/` }
            }
            // If superadmin, go to global view
            if (authStore.isSuperAdmin) {
                return { name: 'superadmin-organizations' }
            }
            // If authenticated but no org, go to Create Org
            return { name: 'create-org' }
        }
        return { name: 'login' }
      }
    },
    // Org scoped routes
    {
      path: '/:orgTag/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/projects',
      name: 'projects',
      component: () => import('@/modules/Projects/views/ProjectsView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/collaborators',
      name: 'collaborators',
      component: () => import('@/modules/Collaborators/views/CollaboratorsView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/settings',
      name: 'settings',
      component: () => import('@/modules/Configuration/views/SettingsView.vue'),
      meta: { requiresAdmin: true },
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/planning',
      name: 'planning',
      component: () => import('@/views/MonthlyPlanningView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/kanban',
      name: 'global-kanban',
      component: () => import('@/modules/Kanban/views/KanbanView.vue'),
      beforeEnter: checkOrgAccess
    },
    {
      path: '/:orgTag/kanban/card/:cardId',
      name: 'global-kanban-card',
      component: () => import('@/modules/Kanban/views/KanbanView.vue'),
      beforeEnter: checkOrgAccess
    },
    // Sub-modules within projects/org context
    {
      path: '/:orgTag/projects/:projectTag/requirements',
      name: 'tagged-requirements',
      component: () => import('@/modules/Requirements/views/RequirementsView.vue')
    },
    {
      path: '/:orgTag/projects/:projectTag/requirements/:requirementNumber',
      name: 'tagged-requirement-detail',
      component: () => import('@/modules/Requirements/views/RequirementsView.vue')
    },
    {
      path: '/:orgTag/projects/:projectTag/requirements/:requirementNumber/section/:section',
      name: 'tagged-requirement-section',
      component: () => import('@/modules/Requirements/views/RequirementsView.vue')
    },
    {
      path: '/:orgTag/projects/:id/estimation',
      name: 'project-estimation',
      component: () => import('@/modules/Allocations/views/ProjectEstimationView.vue')
    },
    {
      path: '/:orgTag/projects/:id/kanban',
      name: 'project-kanban',
      component: () => import('@/modules/Kanban/views/KanbanView.vue')
    },
    {
      path: '/:orgTag/kanban/:projectTag',
      name: 'tagged-kanban-board',
      component: () => import('@/modules/Kanban/views/KanbanView.vue')
    },
    {
      path: '/:orgTag/kanban/:projectTag/card/:cardId',
      name: 'tagged-kanban-card',
      component: () => import('@/modules/Kanban/views/KanbanView.vue')
    }
  ],
})

function checkOrgAccess(to, from, next) {
    const authStore = useAuthStore()
    const userOrgTag = authStore.user?.organization?.tag
    
    if (to.params.orgTag !== userOrgTag) {
      return next({ name: 'unauthorized' })
    }
    next()
}

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  const isPublic = to.meta.public
  const isAuthenticated = authStore.isAuthenticated

  if (!isPublic && !isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.name === 'login' && isAuthenticated) {
    if (authStore.isSuperAdmin && !authStore.user?.organization?.tag) {
        return next({ name: 'superadmin-organizations' })
    }
    return next('/')
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return next('/')
  }

  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
      return next('/')
  }

  next()
})

export default router
