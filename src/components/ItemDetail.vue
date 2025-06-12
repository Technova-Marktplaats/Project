<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiService from '../services/api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const props = defineProps({
  id: String
})

const item = ref(null)
const loading = ref(false)
const error = ref(null)

const reservations = ref([])
const reservationsLoading = ref(false)

// Reservation form data
const reservationForm = ref({
  startDate: '',
  endDate: ''
})
const reservationFormVisible = ref(false)

const isOwner = computed(() => item.value && authStore.user && item.value.user_id === authStore.user.id)
const hasReserved = computed(() => {
  if (!authStore.user) return false
  return reservations.value.some(r => r.user_id === authStore.user.id)
})

const fetchItem = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiService.items.getById(props.id)
    console.log('Item Response:', response.data)
    
    // Check if response has wrapper structure (success, data, message)
    if (response.data.data && typeof response.data.data === 'object') {
      item.value = response.data.data
    } else if (response.data.id) {
      // Direct object response
      item.value = response.data
    } else {
      console.error('Unexpected response structure:', response.data)
      error.value = 'Onverwachte response structuur'
      return
    }
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

const fetchReservations = async () => {
  // Alleen reserveringen ophalen als je eigenaar bent
  if (!isOwner.value) {
    reservations.value = []
    return
  }
  
  reservationsLoading.value = true
  try {
    console.log('Fetching reservations for item:', props.id, 'as owner:', authStore.user?.id)
    // Voor eigenaar: haal reserveringen op voor dit specifieke item
    const resp = await apiService.reservations.getMyItemReservations({ item_id: props.id })
    console.log('Reservations response:', resp.data)
    reservations.value = resp.data.data ? resp.data.data : resp.data
    console.log('Reservations set to:', reservations.value)
  } catch (e) {
    console.error('Reserveringen ophalen mislukt', e)
    reservations.value = []
  } finally { 
    reservationsLoading.value = false 
  }
}

const makeReservation = async () => {
  try {
    const reservationData = {
      item_id: props.id,
      start_date: reservationForm.value.startDate,
      end_date: reservationForm.value.endDate
    }
    
    await apiService.reservations.create(reservationData)
    await fetchReservations()
    
    // Reset form and hide it
    reservationForm.value = { startDate: '', endDate: '' }
    reservationFormVisible.value = false
    
    alert('Reservering succesvol aangemaakt!')
  } catch (e) {
    console.error('Reservering error:', e)
    if (e.response?.status === 409) {
      alert('De geselecteerde periode overlapt met een bestaande reservering.')
    } else if (e.response?.status === 422) {
      alert('Ongeldige datums. Controleer of de einddatum na de startdatum ligt.')
    } else {
      alert('Reservering maken mislukt: ' + (e.response?.data?.message || e.message))
    }
  }
}

const showReservationForm = () => {
  reservationFormVisible.value = true
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]
  reservationForm.value.startDate = today
  reservationForm.value.endDate = today
}

const cancelReservation = () => {
  reservationFormVisible.value = false
  reservationForm.value = { startDate: '', endDate: '' }
}

const approveReservation = async (id) => {
  try {
    await apiService.reservations.approve(id)
    alert('Reservering goedgekeurd!')
    await fetchReservations()
  } catch (e) {
    if (e.response?.status === 404) {
      alert('Reservering niet gevonden of geen toestemming om deze te wijzigen.')
    } else if (e.response?.status === 403) {
      alert('Geen toestemming om deze reservering te wijzigen.')
    } else if (e.response?.status === 409) {
      alert('Kan niet goedkeuren: overlapt met bestaande goedgekeurde reservering.')
    } else {
      alert('Fout bij goedkeuren: ' + (e.response?.data?.message || e.message))
    }
  }
}

const rejectReservation = async (id) => {
  try {
    await apiService.reservations.reject(id)
    alert('Reservering afgewezen!')
    await fetchReservations()
  } catch (e) {
    if (e.response?.status === 404) {
      alert('Reservering niet gevonden of geen toestemming om deze te wijzigen.')
    } else if (e.response?.status === 403) {
      alert('Geen toestemming om deze reservering te wijzigen.')
    } else {
      alert('Fout bij afwijzen: ' + (e.response?.data?.message || e.message))
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Niet opgegeven'
  return new Date(dateString).toLocaleDateString('nl-NL')
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

onMounted(async () => {
  await fetchItem()
  // Reserveringen ophalen nadat item is geladen
  await fetchReservations()
})

// Watch voor als item verandert
watch(item, (newItem) => {
  if (newItem) {
    fetchReservations()
  }
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
                <span>{{ item.category.name || 'Niet opgegeven' }}</span>
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

          <div v-if="!isOwner && !hasReserved" class="info-section reserve-section">
            <button v-if="!reservationFormVisible" @click="showReservationForm" class="reserve-btn">
              Reserveer dit item
            </button>
            
            <div v-if="reservationFormVisible" class="reservation-form">
              <h4>Reservering maken</h4>
              <div class="form-group">
                <label for="startDate">Startdatum:</label>
                <input 
                  id="startDate"
                  v-model="reservationForm.startDate" 
                  type="date" 
                  :min="new Date().toISOString().split('T')[0]"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="endDate">Einddatum:</label>
                <input 
                  id="endDate"
                  v-model="reservationForm.endDate" 
                  type="date" 
                  :min="reservationForm.startDate || new Date().toISOString().split('T')[0]"
                  required
                />
              </div>
              
              <div class="form-actions">
                <button @click="makeReservation" :disabled="!reservationForm.startDate || !reservationForm.endDate" class="confirm-btn">
                  Bevestigen
                </button>
                <button @click="cancelReservation" class="cancel-btn">
                  Annuleren
                </button>
              </div>
            </div>
          </div>

          <div v-if="!isOwner && hasReserved" class="info-section reserve-section">
            <p>Je hebt al een reservering geplaatst voor dit item.</p>
          </div>

          <div v-if="isOwner" class="info-section owner-reservations">
            <h3>Reserveringen</h3>
            <p v-if="reservationsLoading">Reserveringen laden...</p>
            <p v-else-if="reservations.length === 0">Geen reserveringen.</p>
            <div v-else class="reservations-list">
              <div v-for="res in reservations" :key="res.id" class="reservation-item">
                <div class="reservation-info">
                  <div class="reservation-header">
                    <strong>#{{ res.id }}</strong> - {{ res.user?.name || res.user_id }}
                    <span class="status" :class="res.status">{{ res.status }}</span>
                  </div>
                  <div class="reservation-dates">
                    <span class="date-range">
                      📅 {{ formatDate(res.start_date) }} tot {{ formatDate(res.end_date) }}
                    </span>
                  </div>
                </div>
                <div class="reservation-actions" v-if="res.status === 'pending'">
                  <button @click="approveReservation(res.id)" class="approve-btn">Accepteer</button>
                  <button @click="rejectReservation(res.id)" class="reject-btn">Weiger</button>
                </div>
              </div>
            </div>
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

.reserve-section {
  text-align: center;
}

.reserve-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.reserve-btn:hover {
  background: #4b5563;
}

.owner-reservations {
  margin-top: 30px;
}

.reservations-list {
  margin-top: 10px;
}

.reservation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.reservation-item:last-child {
  border-bottom: none;
}

.reservation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reservation-info strong {
  color: #2d3748;
}

.reservation-info span {
  color: #4a5568;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.approve-btn, .reject-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  transition: background-color 0.2s;
}

.approve-btn:hover, .reject-btn:hover {
  background: #4b5563;
}

/* Reservation Form Styles */
.reservation-form {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
}

.reservation-form h4 {
  margin: 0 0 15px 0;
  color: #2d3748;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2d3748;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.confirm-btn {
  background: #38a169;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #2f855a;
}

.confirm-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.cancel-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.cancel-btn:hover {
  background: #cbd5e0;
}

/* Enhanced Reservation Display */
.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.reservation-dates {
  margin-top: 5px;
}

.date-range {
  color: #4a5568;
  font-size: 0.9em;
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 4px;
}
</style> 