<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const items = ref([])
const loading = ref(false)
const error = ref(null)

const fetchItems = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get('http://srv856957.hstgr.cloud/api/items', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconden timeout
    })
    
    console.log('API Response:', response.data)
    items.value = response.data
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
      error.value = 'Netwerk fout: Controleer of je Laravel server draait op marktplaats-backend.test'
    } else {
      error.value = 'Er is een fout opgetreden bij het ophalen van de gegevens: ' + (err.response?.data?.message || err.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchItems()
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
</script>

<template>
  <div class="items-container">
    <div class="header">
      <h2>Items Overzicht</h2>
      <button @click="fetchItems" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Laden...' : 'Vernieuwen' }}
      </button>
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

    <div v-else class="items-grid">
      <div 
        v-for="item in items" 
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
            <span v-if="item.category" class="category">{{ item.category }}</span>
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
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.header h2 {
  color: #2d3748;
  margin: 0;
}

.refresh-btn {
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #3182ce;
}

.refresh-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.loading, .error, .no-items {
  text-align: center;
  padding: 40px;
  color: #4a5568;
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
</style>
