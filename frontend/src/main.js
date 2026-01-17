import { createApp, provide, h } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import hyvuegantt from "hy-vue-gantt"

import './assets/main.css'


import App from './App.vue'
import router from './router'
import { apolloClient } from './apollo'
import { dayjs } from './config';

const app = createApp(App)

app.provide(DefaultApolloClient, apolloClient)
app.use(createPinia())
app.use(router)
app.use(hyvuegantt)

app.config.globalProperties.$dayjs = dayjs
app.mount('#app')
