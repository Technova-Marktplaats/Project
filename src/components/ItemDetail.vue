<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  id: String
})

const item = ref(null)
const loading = ref(false)
const error = ref(null)

const fetchItem = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(`http://marktplaats-backend.test/api/items/${props.id}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
    
    console.log('Item Response:', response.data)
    item.value = response.data
  } catch (err) {
    console.error('Fout bij ophalen item:', err)
    
    if (err.response?.status === 404) {
      error.value = 'Item niet gevonden.'
    } else if (err.response?.status === 500) {
      error.value = 'Server fout bij het ophalen van item details.'
    } else {
      error.value = 'Er is een fout opgetreden: ' + (err.response?.data?.message || err.message)
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const onImageError = (event) => {
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent) {
    parent.innerHTML = '<div class="no-image"><span>Afbeelding niet beschikbaar</span></div>'
  }
}

onMounted(() => {
  fetchItem()
})
</script>

<template>
  <div class="item-detail-container">
    <div class="back-button">
      <button @click="goBack" class="back-btn">
        ← Terug naar overzicht
      </button>
    </div>

    <div v-if="loading" class="loading">
      <p>Item wordt geladen...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchItem" class="retry-btn">Opnieuw proberen</button>
    </div>

    <div v-else-if="item" class="item-detail">
      <div class="item-header">
        <h1>{{ item.title }}</h1>
        <span class="availability" :class="{ 'available': item.available, 'unavailable': !item.available }">
          {{ item.available ? 'Beschikbaar' : 'Niet beschikbaar' }}
        </span>
      </div>

      <div class="item-content">
        <div class="item-images">
          <div v-if="item.images && item.images.length > 0" class="images-grid">
            <img 
              v-for="image in item.images" 
              :key="image.id"
              :src="image.url" 
              :alt="item.title"
              class="detail-img"
              @error="onImageError"
            />
          </div>
          <div v-else class="no-images">
            <span>Geen afbeeldingen beschikbaar</span>
          </div>
        </div>

        <div class="item-info">
          <div class="info-section">
            <h3>Beschrijving</h3>
            <p>{{ item.description || 'Geen beschrijving beschikbaar.' }}</p>
          </div>

          <div class="info-section">
            <h3>Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <strong>Categorie:</strong>
                <span>{{ item.category || 'Niet opgegeven' }}</span>
              </div>
              <div class="detail-item">
                <strong>Aangemaakt:</strong>
                <span>{{ new Date(item.created_at).toLocaleDateString('nl-NL') }}</span>
              </div>
              <div class="detail-item">
                <strong>Laatst bijgewerkt:</strong>
                <span>{{ new Date(item.updated_at).toLocaleDateString('nl-NL') }}</span>
              </div>
              <div class="detail-item">
                <strong>Item ID:</strong>
                <span>#{{ item.id }}</span>
              </div>
            </div>
          </div>

          <div v-if="item.reservations && item.reservations.length > 0" class="info-section">
            <h3>Reserveringen</h3>
            <p>Dit item heeft {{ item.reservations.length }} reservering(en).</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  margin-bottom: 20px;
}

.back-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: #4b5563;
}

.loading, .error {
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

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.item-header h1 {
  margin: 0;
  color: #2d3748;
}

.availability {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
}

.available {
  background: #d3f4e2;
  color: #276749;
}

.unavailable {
  background: #fef2f2;
  color: #b91c1c;
}

.item-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .item-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.item-images {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-images {
  text-align: center;
  padding: 60px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
}

.item-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-section {
  margin-bottom: 30px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  color: #2d3748;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.info-section p {
  color: #4a5568;
  line-height: 1.6;
}

.details-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #2d3748;
}

.detail-item span {
  color: #4a5568;
}

.no-image {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #6b7280;
}
</style> 