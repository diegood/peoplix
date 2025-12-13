import { createApp, provide, h } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { worker } from './mocks/browser'
import { apolloClient } from './apollo'
import { dayjs } from './config';

// async function enableMocking() {
//   if (!import.meta.env.DEV) {
//     return
//   }
//   return worker.start({
//     onUnhandledRequest: 'bypass',
//   })
// }

// enableMocking().then(() => {
  const app = createApp({
    setup() {
      provide(DefaultApolloClient, apolloClient)
    },
    render: () => h(App),
  })

  app.use(createPinia())
  app.use(router)

  app.config.globalProperties.$dayjs = dayjs

  app.mount('#app')
// })
