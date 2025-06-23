<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '../services/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const reservations = ref([])
const loading = ref(false)
const error = ref(null)

// Computed properties voor filtering
const pendingReservations = computed(() => 
  reservations.value.filter(r => r.status === 'pending')
)

const confirmedReservations = computed(() => 
  reservations.value.filter(r => r.status === 'confirmed')
)

const cancelledReservations = computed(() => 
  reservations.value.filter(r => r.status === 'cancelled')
)

// Fetch user's reservations
const fetchMyReservations = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiService.reservations.getMyItemReservations({})
    
    if (response.data.success) {
      reservations.value = response.data.data
    } else if (response.data.data && Array.isArray(response.data.data)) {
      reservations.value = response.data.data
    } else if (Array.isArray(response.data)) {
      reservations.value = response.data
    } else {
      error.value = response.data.message || 'Fout bij ophalen van reserveringen'
    }
  } catch (err) {
    console.error('Error fetching my reservations:', err)
    error.value = err.response?.data?.message || 'Fout bij ophalen van reserveringen'
  } finally {
    loading.value = false
  }
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Niet opgegeven'
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'confirmed': return 'status-confirmed'
    case 'cancelled': return 'status-cancelled'
    default: return 'status-unknown'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Wachtend'
    case 'confirmed': return 'Goedgekeurd'
    case 'cancelled': return 'Afgewezen'
    default: return 'Onbekend'
  }
}

const navigateToItem = (itemId) => {
  router.push(`/item/${itemId}`)
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent && parent.querySelector('.no-image')) {
    parent.querySelector('.no-image').style.display = 'flex'
  }
}

// Lifecycle
onMounted(() => {
  fetchMyReservations()
})
</script>

<template>
  <div class="my-reservations-container">
    <div class="header">
      <h1 class="title">Mijn Reserveringen</h1>
      <button @click="fetchMyReservations" class="btn btn-secondary" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Vernieuwen
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Reserveringen laden...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchMyReservations" class="btn btn-secondary">
        Opnieuw proberen
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="reservations.length === 0" class="empty-state">
      <i class="fas fa-calendar-times"></i>
      <h3>Geen reserveringen gevonden</h3>
      <p>Je hebt nog geen reserveringen gemaakt.</p>
      <router-link to="/" class="btn btn-primary">
        Bekijk beschikbare items
      </router-link>
    </div>

    <!-- Reservations content -->
    <div v-else class="reservations-content">
      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <i class="fas fa-clock"></i>
          <div class="stat-info">
            <span class="stat-number">{{ pendingReservations.length }}</span>
            <span class="stat-label">Wachtend</span>
          </div>
        </div>
        <div class="stat-card confirmed">
          <i class="fas fa-check-circle"></i>
          <div class="stat-info">
            <span class="stat-number">{{ confirmedReservations.length }}</span>
            <span class="stat-label">Goedgekeurd</span>
          </div>
        </div>
        <div class="stat-card cancelled">
          <i class="fas fa-times-circle"></i>
          <div class="stat-info">
            <span class="stat-number">{{ cancelledReservations.length }}</span>
            <span class="stat-label">Afgewezen</span>
          </div>
        </div>
        <div class="stat-card total">
          <i class="fas fa-list"></i>
          <div class="stat-info">
            <span class="stat-number">{{ reservations.length }}</span>
            <span class="stat-label">Totaal</span>
          </div>
        </div>
      </div>

      <!-- Reservations list -->
      <div class="reservations-list">
        <div v-for="reservation in reservations" :key="reservation.id" class="reservation-card">
          <!-- Item image and basic info -->
          <div class="reservation-item-info">
            <div class="item-image" @click="navigateToItem(reservation.item?.id)">
              <img 
                v-if="reservation.item?.images && reservation.item.images.length > 0" 
                :src="reservation.item.images[0].url" 
                :alt="reservation.item.title"
                @error="handleImageError"
              />
              <div v-else class="no-image">
                <i class="fas fa-image"></i>
              </div>
            </div>
            
            <div class="item-details">
              <h3 class="item-title" @click="navigateToItem(reservation.item?.id)">
                {{ reservation.item?.title || 'Onbekend item' }}
              </h3>
              <p class="item-description">
                {{ reservation.item?.description || 'Geen beschrijving beschikbaar' }}
              </p>
              <div class="item-meta">
                <span class="category">
                  <i class="fas fa-tag"></i>
                  {{ reservation.item?.category?.name || 'Geen categorie' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Reservation details -->
          <div class="reservation-details">
            <div class="reservation-header">
              <span class="reservation-id">#{{ reservation.id }}</span>
              <span class="status-badge" :class="getStatusColor(reservation.status)">
                {{ getStatusText(reservation.status) }}
              </span>
            </div>
            
            <div class="reservation-dates">
              <div class="date-item">
                <i class="fas fa-calendar-alt"></i>
                <span>Van: {{ formatDate(reservation.start_date) }}</span>
              </div>
              <div class="date-item">
                <i class="fas fa-calendar-alt"></i>
                <span>Tot: {{ formatDate(reservation.end_date) }}</span>
              </div>
            </div>

            <div class="reservation-meta">
              <span class="created-date">
                <i class="fas fa-clock"></i>
                Aangevraagd: {{ formatDate(reservation.created_at) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="reservation-actions">
            <button @click="navigateToItem(reservation.item?.id)" class="btn btn-outline">
              <i class="fas fa-eye"></i>
              Bekijk item
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-reservations-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #3182ce;
  color: white;
}

.btn-primary:hover {
  background-color: #2c5aa0;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #cbd5e0;
}

.btn-outline {
  background-color: transparent;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-outline:hover {
  background-color: #f7fafc;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #718096;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #e53e3e;
  text-align: center;
}

.error-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
  color: #718096;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #cbd5e0;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem 0;
  color: #4a5568;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card i {
  font-size: 2rem;
}

.stat-card.pending i { color: #d69e2e; }
.stat-card.confirmed i { color: #38a169; }
.stat-card.cancelled i { color: #e53e3e; }
.stat-card.total i { color: #3182ce; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reservation-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.reservation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.reservation-item-info {
  display: flex;
  gap: 1rem;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f7fafc;
  color: #a0aec0;
}

.item-details {
  flex: 1;
}

.item-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  cursor: pointer;
  transition: color 0.2s;
}

.item-title:hover {
  color: #3182ce;
}

.item-description {
  color: #718096;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  font-size: 0.875rem;
  color: #718096;
}

.item-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 200px;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reservation-id {
  font-weight: 600;
  color: #4a5568;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fef5e7;
  color: #d69e2e;
}

.status-confirmed {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-cancelled {
  background-color: #fed7d7;
  color: #742a2a;
}

.status-unknown {
  background-color: #e2e8f0;
  color: #4a5568;
}

.reservation-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}

.reservation-meta {
  font-size: 0.75rem;
  color: #718096;
}

.reservation-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reservation-actions {
  display: flex;
  align-items: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .my-reservations-container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .reservation-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .reservation-item-info {
    flex-direction: column;
  }
  
  .item-image {
    width: 100%;
    height: 150px;
  }
  
  .reservation-details {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 