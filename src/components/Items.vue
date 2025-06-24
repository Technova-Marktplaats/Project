<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '../services/api'
import cacheService from '../services/cache'
import PWAInstallButton from './PWAInstallButton.vue'

const router = useRouter()

const items = ref([])
const loading = ref(false)
const error = ref(null)

// Cache en offline status
const isOffline = ref(!navigator.onLine)
const cacheStatus = ref(null)
let networkCleanup = null

const fetchItems = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiService.items.getAll()
    console.log('API Response:', response.data)
    
    // Check if response has wrapper structure (success, data, message)
    if (response.data.data && Array.isArray(response.data.data)) {
      items.value = response.data.data
    } else if (Array.isArray(response.data)) {
      items.value = response.data
    } else {
      console.error('Unexpected response structure:', response.data)
      items.value = []
    }
    
    // Cache items als ze succesvol zijn opgehaald
    if (items.value.length > 0) {
      await cacheService.cacheItems(items.value)
    }
  } catch (err) {
    console.error('Volledige fout:', err)
    console.error('Response data:', err.response?.data)
    console.error('Response status:', err.response?.status)
    console.error('Response headers:', err.response?.headers)
    
    if (err.response?.status === 500) {
      error.value = 'Server fout (500): Controleer je Laravel logs. Mogelijk database of API endpoint probleem.'
    } else if (err.code === 'ECONNABORTED') {
      error.value = 'Verzoek time-out: De server reageert niet binnen 10 seconden.'
    } else if (err.message.includes('Network Error')) {
      error.value = 'Netwerk fout: Controleer of je Laravel server draait'
    } else {
      error.value = 'Er is een fout opgetreden bij het ophalen van de gegevens: ' + (err.response?.data?.message || err.message)
    }
  } finally {
    loading.value = false
  }
}

// Initialize cache status en network monitoring
const initializeCacheStatus = async () => {
  cacheStatus.value = await cacheService.getCacheStatus()
}

// Const props voor search query van app.vue
const props = defineProps({
  search:{
    type: String,
    default: ''
  }
})
onMounted(async () => {
  await fetchItems()
  await initializeCacheStatus()
  
  // Monitor network changes
  networkCleanup = cacheService.onNetworkChange((status) => {
    isOffline.value = !status.online
    if (status.online && items.value.length === 0) {
      // Als we weer online komen en geen items hebben, probeer opnieuw
      fetchItems()
    }
  })
})

onUnmounted(() => {
  if (networkCleanup) {
    networkCleanup()
  }
})

const onImageError = (event) => {
  console.log('Afbeelding kon niet worden geladen:', event.target.src)
  // Vervang de afbeelding met een placeholder of verberg het
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent) {
    parent.innerHTML = '<div class="no-image"><span>Afbeelding niet beschikbaar</span></div>'
  }
}

const navigateToItem = (itemId) => {
  router.push(`/item/${itemId}`)
}

// Functie voor zoeken
const filteredItems = computed(() => {
  if (!props.search || props.search.trim() === '') {
    return items.value
  }
  
  const query = props.search.toLowerCase()
  return items.value.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.name?.toLowerCase().includes(query)
  )
})


</script>

<template>
  <div class="items-container">
    <div class="header">
      <h2>Items Overzicht</h2>
      
      <div class="header-controls">
        <div class="status-indicators">
          <span v-if="isOffline" class="offline-indicator" title="Offline - cache wordt gebruikt">
            📡 Offline
          </span>
        </div>
        
        <div class="header-actions">
          <button @click="fetchItems" :disabled="loading" class="refresh-btn">
            {{ loading ? 'Laden...' : 'Vernieuwen' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Items worden geladen...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchItems" class="retry-btn">Opnieuw proberen</button>
    </div>

    <div v-else-if="items.length === 0" class="no-items">
      <p>Geen items gevonden.</p>
    </div>

    <div v-else-if="filteredItems.length === 0 && props.search" class="no-items">
      <p>Geen items gevonden voor "{{ props.search }}".</p>
      <p class="search-help">Probeer een andere zoekterm of check je spelling.</p>
    </div>

    <div v-else class="items-grid">
      <div 
        v-for="item in filteredItems" 
        :key="item.id" 
        class="item-card"
        @click="navigateToItem(item.id)"
      >
        <div class="item-image">
          <img 
            v-if="item.images && item.images.length > 0" 
            :src="item.images[0].url" 
            :alt="item.title"
            class="item-img"
            @error="onImageError"
          />
          <div v-else class="no-image">
            <span>Geen afbeelding</span>
          </div>
        </div>
        
        <div class="item-content">
          <h3>{{ item.title || 'Onbekend Item' }}</h3>
          <p v-if="item.description" class="description">{{ item.description }}</p>
          <div class="item-details">
            <span v-if="item.category" class="category">{{ item.category.name }}</span>
            <span class="availability" :class="{ 'available': item.available, 'unavailable': !item.available }">
              {{ item.available ? 'Beschikbaar' : 'Niet beschikbaar' }}
            </span>
          </div>
          <div v-if="item.created_at" class="date">
            Toegevoegd: {{ new Date(item.created_at).toLocaleDateString('nl-NL') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header h2 {
  color: white;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicators {
  display: flex;
  gap: 10px;
  align-items: center;
}

.offline-indicator {
  background: rgba(254, 215, 215, 0.9);
  color: #e53e3e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  border: 1px solid rgba(254, 178, 178, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}



.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9em;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 6px;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.refresh-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: not-allowed;
  transform: none;
}

.loading, .error, .no-items {
  text-align: center;
  padding: 40px;
  color: #4a5568;
}

.search-help {
  color: #718096;
  font-size: 0.9em;
  margin-top: 8px;
}

.error {
  color: #e53e3e;
  background: #fed7d7;
  border-radius: 8px;
  margin: 20px 0;
}

.retry-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background: #c53030;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.item-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.item-card h3 {
  color: #2d3748;
  margin: 0 0 10px 0;
  font-size: 1.25em;
}

.description {
  color: #4a5568;
  margin: 10px 0;
  line-height: 1.5;
}

.item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  flex-wrap: wrap;
  gap: 10px;
}

.price {
  font-weight: bold;
  color: #38a169;
  font-size: 1.1em;
}

.category {
  background: #edf2f7;
  color: #4a5568;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
}

.date {
  color: #718096;
  font-size: 0.9em;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.read-the-docs {
  color: #888;
  margin-top: 40px;
  text-align: center;
  font-size: 0.9em;
}

.item-image {
  width: 100%;
  height: 200px;
  border-radius: 0;
  overflow: hidden;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  border-radius: 8px;
}

.item-content {
  flex: 1;
  padding: 20px;
}

.availability {
  background: #edf2f7;
  color: #4a5568;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
}

.available {
  background: #d3f4e2;
  color: #276749;
}

.unavailable {
  background: #fef2f2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .header h2 {
    text-align: center;
    margin-bottom: 10px;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .status-indicators {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .refresh-btn {
    min-width: 120px;
    padding: 10px 16px;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
  }
}
</style>
