import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store om token te herstellen
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
