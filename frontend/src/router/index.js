import { createRouter, createWebHistory } from 'vue-router'

import RolesView from '@/views/RolesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/roles',
      name: 'roles',
      component: RolesView
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
      path: '/roles',
      name: 'roles',
      component: RolesView
    },
    {
      path: '/collaborators',
      name: 'collaborators',
      component: () => import('@/views/CollaboratorsView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue')
    },
    {
      path: '/technologies',
      name: 'technologies',
      component: () => import('@/views/TechnologiesView.vue')
    },
  ],
})

export default router
