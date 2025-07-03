<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiService from '../services/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const authStore = useAuthStore()

// Form data
const formData = ref({
  name: '',
  location_lat: null,
  location_lon: null
})

// UI state
const loading = ref(false)
const locationLoading = ref(false)
const message = ref('')
const error = ref('')

// Map state
const mapContainer = ref(null)
const map = ref(null)
const marker = ref(null)

// Form validation
const formErrors = ref({
  name: ''
})

// Methods
const validateForm = () => {
  formErrors.value = { name: '' }
  let isValid = true

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Naam is verplicht'
    isValid = false
  } else if (formData.value.name.length > 255) {
    formErrors.value.name = 'Naam mag maximaal 255 karakters bevatten'
    isValid = false
  }

  return isValid
}

const initializeMap = async () => {
  await nextTick()
  
  if (!mapContainer.value) return

  // Initialize map
  map.value = L.map(mapContainer.value).setView([52.3676, 4.9041], 7) // Default to Netherlands

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value)

  // Add marker if location exists
  updateMapLocation()
}

const updateMapLocation = () => {
  if (!map.value) return

  const lat = formData.value.location_lat
  const lon = formData.value.location_lon

  if (lat && lon) {
    // Remove existing marker
    if (marker.value) {
      map.value.removeLayer(marker.value)
    }

    // Add new marker
    marker.value = L.marker([lat, lon]).addTo(map.value)
    marker.value.bindPopup('Jouw locatie').openPopup()

    // Center map on location
    map.value.setView([lat, lon], 13)
  }
}

const updateProfile = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await apiService.profile.update({
      name: formData.value.name,
      location_lat: formData.value.location_lat,
      location_lon: formData.value.location_lon
    })

    // Update user data in store
    authStore.setUser(response.data.user)
    message.value = 'Profiel succesvol bijgewerkt!'
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (err) {
    console.error('Profile update error:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.response?.data?.errors) {
      // Handle validation errors
      const errors = Object.values(err.response.data.errors).flat()
      error.value = errors.join(', ')
    } else {
      error.value = 'Er is een fout opgetreden bij het bijwerken van je profiel'
    }
  } finally {
    loading.value = false
  }
}

const shareLocation = async () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocatie wordt niet ondersteund door je browser'
    return
  }

  locationLoading.value = true
  error.value = ''

  navigator.geolocation.getCurrentPosition(
    (position) => {
      formData.value.location_lat = position.coords.latitude
      formData.value.location_lon = position.coords.longitude
      locationLoading.value = false
      message.value = 'Locatie succesvol opgehaald!'
      
      // Update map with new location
      updateMapLocation()
      
      setTimeout(() => {
        message.value = ''
      }, 3000)
    },
    (err) => {
      console.error('Geolocation error:', err)
      locationLoading.value = false
      error.value = 'Kon locatie niet ophalen. Zorg ervoor dat locatie toegang is ingeschakeld.'
    }
  )
}

const removeLocation = () => {
  formData.value.location_lat = null
  formData.value.location_lon = null
  
  // Remove marker from map
  if (marker.value && map.value) {
    map.value.removeLayer(marker.value)
    marker.value = null
    // Reset map view to Netherlands
    map.value.setView([52.3676, 4.9041], 7)
  }
  
  message.value = 'Locatie verwijderd'
  
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const clearMessages = () => {
  error.value = ''
  message.value = ''
}

// Watch for location changes to update map
watch([() => formData.value.location_lat, () => formData.value.location_lon], () => {
  updateMapLocation()
})

// Initialize form with user data
onMounted(async () => {
  if (authStore.user) {
    formData.value.name = authStore.user.name || ''
    formData.value.location_lat = authStore.user.location_lat || null
    formData.value.location_lon = authStore.user.location_lon || null
  }
  
  // Initialize map after component is mounted
  await initializeMap()
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <h1>Mijn Profiel</h1>
        <p>Beheer je persoonlijke gegevens en voorkeuren</p>
      </div>

      <form @submit.prevent="updateProfile" class="profile-form">
        <!-- Naam sectie -->
        <div class="form-section">
          <h3>Persoonlijke gegevens</h3>
          
          <div class="form-group">
            <label for="name">Volledige naam</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Je volledige naam"
              :class="{ 'error': formErrors.name }"
              @input="clearMessages"
            />
            <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
          </div>

          <div class="form-group">
            <label>E-mail adres</label>
            <input
              type="email"
              :value="authStore.user?.email"
              disabled
              class="disabled-input"
            />
            <span class="help-text">E-mail adres kan niet worden gewijzigd</span>
          </div>
        </div>

        <!-- Locatie sectie -->
        <div class="form-section">
          <h3>Locatie delen</h3>
          <p class="section-description">
            Deel je locatie om items in je buurt te vinden en anderen te helpen je items te vinden.
          </p>

          <div class="location-status">
            <div v-if="formData.location_lat && formData.location_lon" class="location-shared">
              <div class="location-icon">📍</div>
              <div class="location-info">
                <strong>Locatie gedeeld</strong>
                <span>Lat: {{ (parseFloat(formData.location_lat) || 0).toFixed(6) }}, Lon: {{ (parseFloat(formData.location_lon) || 0).toFixed(6) }}</span>
              </div>
              <button 
                type="button" 
                @click="removeLocation"
                class="remove-location-btn"
              >
                Verwijderen
              </button>
            </div>
            
            <div v-else class="location-not-shared">
              <div class="location-icon">📍</div>
              <div class="location-info">
                <strong>Locatie niet gedeeld</strong>
                <span>Deel je locatie om items in je buurt te vinden</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            @click="shareLocation"
            :disabled="locationLoading"
            class="location-btn"
          >
            <span v-if="locationLoading">Locatie ophalen...</span>
            <span v-else>{{ formData.location_lat ? 'Locatie bijwerken' : 'Locatie delen' }}</span>
          </button>
        </div>

        <!-- Kaart sectie -->
        <div class="form-section">
          <h3>Locatie op kaart</h3>
          <p class="section-description">
            {{ formData.location_lat && formData.location_lon ? 'Hier is je huidige locatie op de kaart:' : 'Deel je locatie om deze op de kaart te zien.' }}
          </p>
          
          <div class="map-container">
            <div ref="mapContainer" class="map"></div>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="message" class="success-message">
          <p>{{ message }}</p>
        </div>

        <div v-if="error" class="error-message-box">
          <p>{{ error }}</p>
        </div>

        <!-- Submit button -->
        <button 
          type="submit" 
          class="save-btn"
          :disabled="loading"
        >
          {{ loading ? 'Bezig met opslaan...' : 'Profiel opslaan' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.profile-header {
  text-align: center;
  margin-bottom: 40px;
}

.profile-header h1 {
  color: #1f2937;
  margin: 0 0 10px 0;
  font-size: 2em;
  font-weight: 600;
}

.profile-header p {
  color: #6b7280;
  margin: 0;
  font-size: 0.95em;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  background: #f9fafb;
}

.form-section h3 {
  color: #1f2937;
  margin: 0 0 8px 0;
  font-size: 1.2em;
  font-weight: 600;
}

.section-description {
  color: #6b7280;
  margin: 0 0 20px 0;
  font-size: 0.9em;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9em;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
}

.disabled-input {
  background: #f3f4f6 !important;
  color: #6b7280 !important;
  cursor: not-allowed !important;
}

.help-text {
  color: #6b7280;
  font-size: 0.8em;
}

.error-message {
  color: #ef4444;
  font-size: 0.8em;
}

.location-status {
  margin-bottom: 16px;
}

.location-shared,
.location-not-shared {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.location-shared {
  border-color: #10b981;
  background: #f0fdf4;
}

.location-icon {
  font-size: 1.5em;
}

.location-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.location-info strong {
  color: #1f2937;
  font-size: 0.9em;
}

.location-info span {
  color: #6b7280;
  font-size: 0.8em;
}

.location-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  width: 100%;
}

.location-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.location-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.remove-location-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-location-btn:hover {
  background: #dc2626;
}

/* Map styles */
.map-container {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.map {
  height: 300px;
  width: 100%;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px;
  color: #166534;
  font-size: 0.9em;
}

.error-message-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  color: #b91c1c;
  font-size: 0.9em;
}

.save-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.save-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 640px) {
  .profile-card {
    padding: 20px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .map {
    height: 250px;
  }
}
</style> 