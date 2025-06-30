import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store om token te herstellen
const authStore = useAuthStore()
authStore.initializeAuth()

// PWA Install Prompt Handler
let deferredPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎯 beforeinstallprompt event ontvangen!')
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt = e
  window.deferredPrompt = e
  
  // Log details
  console.log('📱 PWA installatie prompt beschikbaar')
  console.log('Platform:', e.platforms)
})

// Service Worker registratie en PWA functionaliteit
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('✅ Service Worker geregistreerd:', registration.scope)
      
      // Luister naar updates
      let updateCheckInProgress = false
      registration.addEventListener('updatefound', () => {
        if (updateCheckInProgress) return
        updateCheckInProgress = true
        
        const newWorker = registration.installing
        console.log('🔄 Service Worker update gevonden')
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 Nieuwe Service Worker beschikbaar')
            // Stille update - alleen popup in productie
            if (import.meta.env.PROD) {
              if (confirm('Er is een update beschikbaar. Wil je de pagina herladen?')) {
                window.location.reload()
              }
            }
          }
          
          if (newWorker.state === 'activated') {
            updateCheckInProgress = false
          }
        })
      })
      
      // PWA installatie status checken
      if (registration.active) {
        console.log('📱 PWA is klaar voor installatie')
      }
      
    } catch (error) {
      console.error('❌ Service Worker registratie mislukt:', error)
    }
  })
  
  // Online/Offline status monitoring
  window.addEventListener('online', () => {
    console.log('🌐 Internetverbinding hersteld')
    // Trigger een sync als gewenst
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_DATA'
      })
    }
  })
  
  window.addEventListener('offline', () => {
    console.log('📵 Offline modus geactiveerd')
  })
  
} else {
  console.log('⚠️ Service Worker wordt niet ondersteund in deze browser')
}

app.mount('#app')
