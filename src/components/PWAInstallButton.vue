<script setup>
import { ref, onMounted } from 'vue'
import cacheService from '../services/cache'

const showInstallButton = ref(false)
const isInstalling = ref(false)
const isPWAInstalled = ref(false)
const debugInfo = ref('')
const showInstructionsModal = ref(false)
const instructionsText = ref('')

onMounted(async () => {
  console.log('🔍 PWA Install Button - Starting checks...')
  
  // Check if PWA is already installed
  isPWAInstalled.value = cacheService.isPWAInstalled()
  console.log('📱 PWA already installed:', isPWAInstalled.value)
  
  if (!isPWAInstalled.value) {
    // Check PWA criteria
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost'
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasManifest = document.querySelector('link[rel="manifest"]')
    
    // Test manifest loading
    if (hasManifest) {
      try {
        const manifestResponse = await fetch('/manifest.json')
        const manifestData = await manifestResponse.json()
        console.log('📋 Manifest loaded:', manifestData.name)
      } catch (error) {
        console.error('❌ Manifest loading failed:', error)
      }
    }
    
    debugInfo.value = `HTTPS: ${isHTTPS}, SW: ${hasServiceWorker}, Manifest: ${!!hasManifest}`
    console.log('🔍 PWA Requirements:', debugInfo.value)
    
    // Always show install button for testing
    showInstallButton.value = true
    console.log('🧪 Showing install button for testing')
    
    if (isHTTPS && hasServiceWorker && hasManifest) {
      // Wait for install prompt in background
      try {
        console.log('⏳ Waiting for install prompt...')
        const prompt = await cacheService.getInstallPrompt()
        console.log('📱 Install prompt available:', !!prompt)
        
        if (prompt) {
          console.log('✅ Real install prompt found!')
        }
      } catch (error) {
        console.log('❌ PWA install prompt error:', error)
      }
    } else {
      console.log('⚠️ PWA requirements not met')
    }
  }
})

const installPWA = async () => {
  if (isInstalling.value) return
  
  isInstalling.value = true
  
  try {
    // Probeer eerst automatische installatie
    const result = await cacheService.triggerInstall()
    
    if (result.success && result.installed) {
      showInstallButton.value = false
      isPWAInstalled.value = true
      alert('✅ App succesvol geïnstalleerd! Je kunt deze nu gebruiken als desktop app.')
      return
    } else if (result.success && !result.installed) {
      // User declined automatic install
      console.log('User declined PWA installation')
      return
    }
    
    // Automatische installatie niet beschikbaar - toon handmatige instructies
    showManualInstallInstructions()
    
  } catch (error) {
    console.error('PWA installation error:', error)
    showManualInstallInstructions()
  } finally {
    isInstalling.value = false
  }
}

const showManualInstallInstructions = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  let instructions = ''
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    instructions = `🔹 Google Chrome:
1. Kijk in de adresbalk naar een installatie icoon (📱)
2. Of klik op menu (⋮) → "App installeren"
3. Of ga naar menu → "Meer tools" → "Snelkoppeling maken"

💡 Tip: Het installatie icoon verschijnt meestal na een paar bezoeken aan de site.`
  } else if (userAgent.includes('edg')) {
    instructions = `🔹 Microsoft Edge:
1. Klik op menu (...) → "Apps"
2. Selecteer "Deze site als app installeren"
3. Geef de app een naam en klik "Installeren"`
  } else if (userAgent.includes('firefox')) {
    instructions = `🔹 Mozilla Firefox:
1. Kijk in de adresbalk naar een app icoon
2. Of ga naar menu → "Deze pagina installeren"
3. Firefox ondersteunt PWA installatie beperkt`
  } else if (userAgent.includes('safari')) {
    instructions = `🔹 Safari (iOS/macOS):
1. Klik op het deel icoon (□↗)
2. Selecteer "Voeg toe aan beginscherm"
3. Geef de app een naam en tik "Voeg toe"`
  } else {
    instructions = `🔹 Algemene instructies:
1. Zoek in je browser menu naar "App installeren"
2. Of zoek naar een installatie icoon in de adresbalk
3. Sommige browsers ondersteunen PWA installatie niet volledig`
  }
  
  instructions += '\n\n✨ Na installatie kun je de app gebruiken als een gewone desktop/mobiele app!'
  
  instructionsText.value = instructions
  showInstructionsModal.value = true
}

const closeInstructionsModal = () => {
  showInstructionsModal.value = false
}
</script>

<template>
  <div v-if="showInstallButton && !isPWAInstalled" class="pwa-install-container">
    <button 
      @click="installPWA" 
      :disabled="isInstalling"
      class="pwa-install-btn"
      title="Installeer als desktop app"
    >
      <span class="install-icon">📱</span>
      <span>{{ isInstalling ? 'Installeren...' : 'Installeer als App' }}</span>
    </button>
  </div>
  
  <div v-else-if="isPWAInstalled" class="pwa-installed-indicator">
    <span class="installed-icon">✅</span>
    <span>App geïnstalleerd</span>
  </div>
  
  <!-- Debug info (remove in production) -->
  <div v-else class="pwa-debug-info">
    <small>🔍 PWA Debug: {{ debugInfo }}</small>
    <br>
    <small>Install button: {{ showInstallButton ? 'Shown' : 'Hidden' }}</small>
    <br>
    <small>💡 Klik op "Installeer als App" voor installatie instructies</small>
  </div>

  <!-- Instructions Modal -->
  <div v-if="showInstructionsModal" class="modal-overlay" @click="closeInstructionsModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📱 PWA Installatie Instructies</h3>
        <button @click="closeInstructionsModal" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <pre>{{ instructionsText }}</pre>
      </div>
      <div class="modal-footer">
        <button @click="closeInstructionsModal" class="ok-btn">Begrepen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pwa-install-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.pwa-install-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.pwa-install-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.pwa-install-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.install-icon {
  font-size: 1.1em;
}

.pwa-installed-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #38a169;
  font-weight: 500;
  font-size: 0.9em;
  justify-content: center;
  margin: 10px 0;
  padding: 8px 16px;
  background: #f0fff4;
  border-radius: 20px;
  border: 1px solid #9ae6b4;
}

.installed-icon {
  font-size: 1.1em;
}

.pwa-debug-info {
  text-align: center;
  color: #666;
  font-size: 0.8em;
  margin: 10px 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px dashed #ccc;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
}

.modal-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-body pre {
  white-space: pre-wrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.9em;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  text-align: right;
}

.ok-btn {
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.ok-btn:hover {
  background: #3182ce;
}

@media (max-width: 768px) {
  .pwa-install-btn {
    font-size: 0.85em;
    padding: 10px 20px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .modal-header, .modal-body, .modal-footer {
    padding: 15px;
  }
}
</style> 