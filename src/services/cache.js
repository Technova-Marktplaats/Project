// Cache Service voor communicatie met Service Worker
class CacheService {
  constructor() {
    this.isServiceWorkerSupported = 'serviceWorker' in navigator
    this.serviceWorkerRegistration = null
  }

  // Initialiseer cache service
  async init() {
    if (!this.isServiceWorkerSupported) {
      console.warn('⚠️ Service Worker wordt niet ondersteund')
      return false
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready
      console.log('✅ Cache Service geïnitialiseerd')
      return true
    } catch (error) {
      console.error('❌ Cache Service initialisatie mislukt:', error)
      return false
    }
  }

  // Check of service worker actief is
  isActive() {
    return this.isServiceWorkerSupported && 
           this.serviceWorkerRegistration && 
           navigator.serviceWorker.controller
  }

  // Cache items handmatig
  async cacheItems(items) {
    if (!this.isActive()) {
      console.warn('⚠️ Service Worker niet actief - kan items niet cachen')
      return false
    }

    try {
      // Serialiseer items om Proxy objects te vermijden
      const serializedItems = JSON.parse(JSON.stringify(items))
      
      // Stuur message naar service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ITEMS',
        items: serializedItems
      })
      
      console.log('💾 Items verzonden naar cache:', serializedItems.length)
      return true
    } catch (error) {
      console.error('❌ Items caching mislukt:', error)
      return false
    }
  }

  // Wis alle caches
  async clearCache() {
    if (!this.isActive()) {
      console.warn('⚠️ Service Worker niet actief - kan cache niet wissen')
      return false
    }

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      })
      
      console.log('🗑️ Cache wissen opdracht verzonden')
      return true
    } catch (error) {
      console.error('❌ Cache wissen mislukt:', error)
      return false
    }
  }

  // Krijg cache status
  async getCacheStatus() {
    if (!this.isActive()) {
      return { 
        supported: false, 
        active: false,
        message: 'Service Worker niet ondersteund of niet actief'
      }
    }

    try {
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          resolve({
            supported: true,
            active: true,
            ...event.data
          })
        }

        navigator.serviceWorker.controller.postMessage({
          type: 'GET_CACHE_STATUS'
        }, [messageChannel.port2])

        // Timeout na 5 seconden
        setTimeout(() => {
          reject(new Error('Cache status timeout'))
        }, 5000)
      })
    } catch (error) {
      console.error('❌ Cache status ophalen mislukt:', error)
      return { 
        supported: true, 
        active: false, 
        error: error.message 
      }
    }
  }

  // Check of app offline is
  isOffline() {
    return !navigator.onLine
  }

  // Luister naar online/offline events
  onNetworkChange(callback) {
    if (typeof callback !== 'function') return

    const onOnline = () => callback({ online: true })
    const onOffline = () => callback({ online: false })

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }

  // Force service worker update
  async forceUpdate() {
    if (!this.serviceWorkerRegistration) {
      console.warn('⚠️ Geen service worker registratie gevonden')
      return false
    }

    try {
      await this.serviceWorkerRegistration.update()
      console.log('🔄 Service Worker update geforceerd')
      return true
    } catch (error) {
      console.error('❌ Service Worker update mislukt:', error)
      return false
    }
  }

  // Get installation prompt (voor PWA installatie)
  async getInstallPrompt() {
    return new Promise((resolve, reject) => {
      // Check if already stored
      if (window.deferredPrompt) {
        resolve(window.deferredPrompt)
        return
      }

      // Listen for the event
      const handleBeforeInstallPrompt = (e) => {
        console.log('📱 PWA install prompt event ontvangen')
        // Prevent default browser install prompt
        e.preventDefault()
        // Store the event
        window.deferredPrompt = e
        resolve(e)
        // Remove listener
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        resolve(null)
      }, 5000)
    })
  }

  // Trigger PWA installatie
  async triggerInstall() {
    // Probeer eerst opgeslagen prompt
    if (window.deferredPrompt) {
      try {
        console.log('🔄 Gebruik opgeslagen install prompt')
        await window.deferredPrompt.prompt()
        const result = await window.deferredPrompt.userChoice
        
        if (result.outcome === 'accepted') {
          console.log('✅ PWA installatie geaccepteerd')
          window.deferredPrompt = null
          return { success: true, installed: true }
        } else {
          console.log('❌ PWA installatie geweigerd')
          return { success: true, installed: false }
        }
      } catch (error) {
        console.error('❌ Opgeslagen prompt fout:', error)
      }
    }
    
    // Probeer nieuwe prompt te krijgen
    const prompt = await this.getInstallPrompt()
    
    if (!prompt) {
      console.log('💡 PWA installatie prompt niet beschikbaar')
      
      // Check waarom niet beschikbaar
      const reasons = []
      if (this.isPWAInstalled()) reasons.push('Already installed')
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') reasons.push('Not HTTPS')
      if (!('serviceWorker' in navigator)) reasons.push('No Service Worker support')
      if (!document.querySelector('link[rel="manifest"]')) reasons.push('No manifest')
      
      console.log('🔍 Install prompt niet beschikbaar omdat:', reasons.join(', '))
      return { success: false, reason: 'not_available', details: reasons }
    }

    try {
      // Show install prompt
      console.log('📱 Toon install prompt')
      await prompt.prompt()
      
      // Wait for user response
      const result = await prompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('✅ PWA installatie geaccepteerd')
        return { success: true, installed: true }
      } else {
        console.log('❌ PWA installatie geweigerd')
        return { success: true, installed: false }
      }
    } catch (error) {
      console.error('❌ PWA installatie fout:', error)
      return { success: false, error: error.message }
    }
  }

  // Check of app geïnstalleerd is als PWA
  isPWAInstalled() {
    return window.matchMedia && 
           window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }
}

// Singleton instance
const cacheService = new CacheService()

// Auto-initialiseer na DOM load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    cacheService.init()
  })
}

export default cacheService 