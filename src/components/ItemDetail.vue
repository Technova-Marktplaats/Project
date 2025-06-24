<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiService from '../services/api'
import { useAuthStore } from '../stores/auth'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

// Watchlist state
const isOnWatchlist = ref(false)
const watchlistLoading = ref(false)

// Map state
const mapContainer = ref(null)
const map = ref(null)
const userMarker = ref(null)
const ownerMarker = ref(null)
const distanceLine = ref(null)
const distance = ref(null)

const isOwner = computed(() => item.value && authStore.user && item.value.user_id === authStore.user.id)
const hasReserved = computed(() => {
  if (!authStore.user) return false
  return reservations.value.some(r => r.user_id === authStore.user.id)
})

// Check if both locations are available for map display
const canShowMap = computed(() => {
  const userHasLocation = authStore.user?.location_lat && authStore.user?.location_lon
  const ownerHasLocation = item.value?.user?.location_lat && item.value?.user?.location_lon
  return userHasLocation && ownerHasLocation && !isOwner.value
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

    // Stel watchlist status in op basis van backend response
    if (authStore.user && item.value.op_watchlist !== undefined) {
      isOnWatchlist.value = item.value.op_watchlist
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

const toggleWatchlist = async () => {
  if (watchlistLoading.value) return
  
  watchlistLoading.value = true
  try {
    if (isOnWatchlist.value) {
      await apiService.watchlist.remove(props.id)
      isOnWatchlist.value = false
      alert('Item verwijderd van watchlist!')
    } else {
      await apiService.watchlist.add(props.id)
      isOnWatchlist.value = true
      alert('Item toegevoegd aan watchlist!')
    }
  } catch (e) {
    console.error('Watchlist error:', e)
    if (e.response?.status === 404) {
      alert('Item niet gevonden.')
    } else if (e.response?.status === 403) {
      alert('Geen toestemming voor deze actie.')
    } else {
      alert('Fout bij wijzigen watchlist: ' + (e.response?.data?.message || e.message))
    }
  } finally {
    watchlistLoading.value = false
  }
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

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

const initializeMap = async () => {
  if (!canShowMap.value) return
  
  await nextTick()
  
  if (!mapContainer.value) return

  // Initialize map
  map.value = L.map(mapContainer.value).setView([52.3676, 4.9041], 7) // Default to Netherlands

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value)

  updateMapMarkers()
}

const updateMapMarkers = () => {
  if (!map.value || !canShowMap.value) return

  const userLat = authStore.user.location_lat
  const userLon = authStore.user.location_lon
  const ownerLat = item.value.user.location_lat
  const ownerLon = item.value.user.location_lon

  // Remove existing markers and line
  if (userMarker.value) map.value.removeLayer(userMarker.value)
  if (ownerMarker.value) map.value.removeLayer(ownerMarker.value)
  if (distanceLine.value) map.value.removeLayer(distanceLine.value)

  // Create custom icons
  const userIcon = L.divIcon({
    html: '<div style="background-color: #4f46e5; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  const ownerIcon = L.divIcon({
    html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  // Add user marker (blue)
  userMarker.value = L.marker([userLat, userLon], { icon: userIcon }).addTo(map.value)
  userMarker.value.bindPopup('Jouw locatie')

  // Add owner marker (red)
  ownerMarker.value = L.marker([ownerLat, ownerLon], { icon: ownerIcon }).addTo(map.value)
  ownerMarker.value.bindPopup(`Locatie van ${item.value.user.name || 'eigenaar'}`)

  // Add line between markers
  distanceLine.value = L.polyline([
    [userLat, userLon],
    [ownerLat, ownerLon]
  ], {
    color: '#6b7280',
    weight: 3,
    opacity: 0.7,
    dashArray: '5, 10'
  }).addTo(map.value)

  // Calculate and store distance
  distance.value = calculateDistance(userLat, userLon, ownerLat, ownerLon)

  // Fit map to show both markers
  const group = new L.featureGroup([userMarker.value, ownerMarker.value])
  map.value.fitBounds(group.getBounds().pad(0.1))
}

const formatDate = (dateString) => {
  if (!dateString) return 'Niet opgegeven'
  return new Date(dateString).toLocaleDateString('nl-NL')
}

const formatDistance = (dist) => {
  if (dist < 1) {
    return `${Math.round(dist * 1000)} meter`
  }
  return `${dist.toFixed(1)} km`
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
const shareResult = ref('')

const shareItem = async () => {
  if (!item.value) return

  const shareData = {
    title: item.value.title,
    text: item.value.description || 'Bekijk dit item op onze deelplatform!',
    url: window.location.href
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
      shareResult.value = 'Item succesvol gedeeld!'
    } else {
      shareResult.value = 'Web Share API wordt niet ondersteund door je browser.'
    }
  } catch (err) {
    console.error('Error sharing:', err)
    shareResult.value = `Fout bij delen: ${err.message || err}`
  }

  setTimeout(() => {
    shareResult.value = ''
  }, 3000) //Time out 3 secconden
}

onMounted(async () => {
  await fetchItem()
  // Reserveringen ophalen nadat item is geladen
  await fetchReservations()
  // Kaart initialiseren als beide locaties beschikbaar zijn
  await initializeMap()
})

// Watch voor als item verandert
watch(item, async (newItem) => {
  if (newItem) {
    await fetchReservations()
    // Update kaart als item verandert
    await initializeMap()
  }
})

// Watch voor kaart updates
watch(canShowMap, async (canShow) => {
  if (canShow) {
    await initializeMap()
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

          <div v-if="!isOwner && !hasReserved" class="info-section reserve-section">
            <div class="action-buttons">
              <button v-if="!reservationFormVisible" @click="showReservationForm" class="reserve-btn">
                Reserveer dit item
              </button>
              <button 
                @click="toggleWatchlist" 
                :disabled="watchlistLoading"
                class="watchlist-btn"
              >
                {{ watchlistLoading ? 'Laden...' : (isOnWatchlist ? '★ Op watchlist' : '☆ Toevoegen aan watchlist') }}
              </button>
                  <div class="share-section">
                <button @click="shareItem" class="share-btn">
                  <span>Deel dit product met anderen in uw contacten!</span>
                </button>
                <p v-if="shareResult" class="share-result">{{ shareResult }}</p>
              </div>
            </div>
            </div>
            
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

      <!-- Locatie kaart sectie -->
      <div v-if="canShowMap" class="location-section">
        <div class="location-header">
          <h2>Locatie en afstand</h2>
          <div v-if="distance" class="distance-info">
            <span class="distance-icon">📍</span>
            <span class="distance-text">Afstand: {{ formatDistance(distance) }}</span>
          </div>
        </div>
        
        <div class="location-legend">
          <div class="legend-item">
            <div class="legend-marker user-marker"></div>
            <span>Jouw locatie</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker owner-marker"></div>
            <span>Locatie eigenaar</span>
          </div>
        </div>

        <div class="map-container">
          <div ref="mapContainer" class="location-map"></div>
        </div>
      </div>

      <div v-else-if="!isOwner" class="no-location-info">
        <div class="no-location-content">
          <span class="no-location-icon">📍</span>
          <h3>Locatie niet beschikbaar</h3>
          <p v-if="!authStore.user?.location_lat || !authStore.user?.location_lon">
            Deel je locatie in je profiel om de afstand tot items te zien.
          </p>
          <p v-else-if="!item?.user?.location_lat || !item?.user?.location_lon">
            De eigenaar van dit item heeft geen locatie gedeeld.
          </p>
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

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
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

.watchlist-btn {
  background: #9ca3af;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.watchlist-btn:hover:not(:disabled) {
  background: #6b7280;
}

.watchlist-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
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

/* Location section styles */
.location-section {
  margin-top: 40px;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.location-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5em;
}

.distance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f9ff;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #bae6fd;
}

.distance-icon {
  font-size: 1.2em;
}

.distance-text {
  font-weight: 600;
  color: #0369a1;
}

.location-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  color: #4a5568;
}

.legend-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.user-marker {
  background-color: #4f46e5;
}

.owner-marker {
  background-color: #ef4444;
}

.map-container {
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.location-map {
  height: 400px;
  width: 100%;
}

.no-location-info {
  margin-top: 40px;
  background: #f8fafc;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 40px;
}

.no-location-content {
  text-align: center;
  color: #6b7280;
}

.no-location-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
  opacity: 0.5;
}

.no-location-content h3 {
  margin: 0 0 10px 0;
  color: #4a5568;
}

.no-location-content p {
  margin: 5px 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .location-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .location-legend {
    flex-direction: column;
    gap: 10px;
  }
  
  .location-map {
    height: 300px;
  }
  
  .location-section {
    padding: 20px;
  }
  /* Share Button Styles */
.share-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.share-btn:hover {
  background: #3182ce;
}

.share-result {
  margin-top: 10px;
  padding: 8px 16px;
  border-radius: 4px;
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 0.9em;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;
}

}
</style> 