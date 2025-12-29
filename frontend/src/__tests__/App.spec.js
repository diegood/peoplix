import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../App.vue'

const RouterLink = {
  template: '<a><slot /></a>'
}
const RouterView = {
  template: '<div id="router-view" />'
}

describe('App', () => {
  it('renders layout components correctly', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Stub Toast/Confirm if needed, or mount deeply if they are simple
    // We mock Router components to avoid router warning
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink,
          RouterView,
          // Stub icons to avoid complexity
          'LayoutDashboard': true,
          'Users': true,
          'FolderKanban': true,
          'BarChart3': true,
          'Settings': true,
          'Calendar': true,
          'UserCog': true,
          'LogOut': true
        }
      }
    })

    // App layout has a main RouterView container
    expect(wrapper.findComponent(RouterView).exists()).toBe(true)
    // Should have ToastNotification
    expect(wrapper.findComponent({ name: 'ToastNotification' }).exists()).toBe(true)
  })
})
