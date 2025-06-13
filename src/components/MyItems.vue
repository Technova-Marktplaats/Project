<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '../services/api.js'

export default {
  name: 'MyItems',
  setup() {
    const router = useRouter()
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const showDeleteModal = ref(false)
    const itemToDelete = ref(null)
    const deleting = ref(false)

    // Fetch user's items
    const fetchMyItems = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await apiService.items.getMyItems()
        
        if (response.data.success) {
          items.value = response.data.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Handle case where response has wrapper structure
          items.value = response.data.data
        } else if (Array.isArray(response.data)) {
          // Handle case where response is direct array
          items.value = response.data
        } else {
          error.value = response.data.message || 'Fout bij ophalen van items'
        }
      } catch (err) {
        console.error('Error fetching my items:', err)
        error.value = err.response?.data?.message || 'Fout bij ophalen van items'
      } finally {
        loading.value = false
      }
    }

    // Delete item
    const confirmDelete = (item) => {
      itemToDelete.value = item
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      itemToDelete.value = null
    }

    const deleteItem = async () => {
      if (!itemToDelete.value) return
      
      deleting.value = true
      
      try {
        const response = await apiService.items.delete(itemToDelete.value.id)
        
        if (response.data.success) {
          // Remove item from list
          items.value = items.value.filter(item => item.id !== itemToDelete.value.id)
          showDeleteModal.value = false
          itemToDelete.value = null
        } else {
          alert(response.data.message || 'Fout bij verwijderen van item')
        }
      } catch (err) {
        console.error('Error deleting item:', err)
        alert(err.response?.data?.message || 'Fout bij verwijderen van item')
      } finally {
        deleting.value = false
      }
    }

    // Helper functions
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const handleImageError = (event) => {
      event.target.style.display = 'none'
      const parent = event.target.parentElement
      if (parent && parent.querySelector('.no-image')) {
        parent.querySelector('.no-image').style.display = 'flex'
      }
    }

    const getPendingReservations = (item) => {
      return item.reservations?.filter(r => r.status === 'pending') || []
    }

    const getConfirmedReservations = (item) => {
      return item.reservations?.filter(r => r.status === 'confirmed') || []
    }

    // Lifecycle
    onMounted(() => {
      fetchMyItems()
    })

    return {
      items,
      loading,
      error,
      showDeleteModal,
      itemToDelete,
      deleting,
      fetchMyItems,
      confirmDelete,
      cancelDelete,
      deleteItem,
      truncateText,
      formatDate,
      handleImageError,
      getPendingReservations,
      getConfirmedReservations
    }
  }
}
</script>

<template>
  <div class="my-items-container">
    <div class="header">
      <h1 class="title">Mijn Items</h1>
      <router-link to="/add-item" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Nieuw Item Toevoegen
      </router-link>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Items laden...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchMyItems" class="btn btn-secondary">
        Opnieuw proberen
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="empty-state">
      <i class="fas fa-box-open"></i>
      <h3>Geen items gevonden</h3>
      <p>Je hebt nog geen items toegevoegd.</p>
      <router-link to="/add-item" class="btn btn-primary">
        Voeg je eerste item toe
      </router-link>
    </div>

    <!-- Items grid -->
    <div v-else class="items-grid">
      <div v-for="item in items" :key="item.id" class="item-card">
        <!-- Item afbeelding -->
        <div class="item-image">
          <img 
            v-if="item.images && item.images.length > 0" 
            :src="item.images[0].url" 
            :alt="item.title"
            @error="handleImageError"
          />
          <div v-else class="no-image">
            <i class="fas fa-image"></i>
            <span>Geen afbeelding</span>
          </div>
          
          <!-- Status badge -->
          <div class="status-badge" :class="{ 'available': item.available, 'unavailable': !item.available }">
            {{ item.available ? 'Beschikbaar' : 'Niet beschikbaar' }}
          </div>
        </div>

        <!-- Item info -->
        <div class="item-info">
          <h3 class="item-title">{{ item.title }}</h3>
          <p class="item-description">{{ truncateText(item.description, 100) }}</p>
          <div class="item-meta">
            <span class="category">
              <i class="fas fa-tag"></i>
              {{ item.category?.name || 'Geen categorie' }}
            </span>
            <span class="created-date">
              <i class="fas fa-calendar"></i>
              {{ formatDate(item.created_at) }}
            </span>
          </div>

          <!-- Reserveringen info -->
          <div v-if="item.reservations && item.reservations.length > 0" class="reservations-info">
            <div class="reservation-stats">
              <span class="pending" v-if="getPendingReservations(item).length > 0">
                <i class="fas fa-clock"></i>
                {{ getPendingReservations(item).length }} wachtend
              </span>
              <span class="confirmed" v-if="getConfirmedReservations(item).length > 0">
                <i class="fas fa-check"></i>
                {{ getConfirmedReservations(item).length }} bevestigd
              </span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="item-actions">
          <router-link :to="`/item/${item.id}`" class="btn btn-outline">
            <i class="fas fa-eye"></i>
            Bekijken
          </router-link>
          <button @click="confirmDelete(item)" class="btn btn-danger">
            <i class="fas fa-trash"></i>
            Verwijderen
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Item verwijderen</h3>
          <button @click="cancelDelete" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Weet je zeker dat je "<strong>{{ itemToDelete?.title }}</strong>" wilt verwijderen?</p>
          <p class="warning">Deze actie kan niet ongedaan gemaakt worden.</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn btn-secondary">Annuleren</button>
          <button @click="deleteItem" class="btn btn-danger" :disabled="deleting">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ deleting ? 'Verwijderen...' : 'Verwijderen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-items-container {
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

.btn-secondary:hover {
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

.btn-danger {
  background-color: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background-color: #c53030;
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

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.item-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.item-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f7fafc;
  color: #a0aec0;
}

.no-image i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.available {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.unavailable {
  background-color: #fed7d7;
  color: #742a2a;
}

.item-info {
  padding: 1.5rem;
}

.item-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.item-description {
  color: #718096;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #718096;
}

.item-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reservations-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.reservation-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.reservation-stats .pending {
  color: #d69e2e;
}

.reservation-stats .confirmed {
  color: #38a169;
}

.item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
}

.item-actions .btn {
  flex: 1;
  min-width: 120px;
  justify-content: center;
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #718096;
  cursor: pointer;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #4a5568;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body .warning {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Responsive design */
@media (max-width: 768px) {
  .my-items-container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .item-actions {
    flex-direction: column;
  }
  
  .item-actions .btn {
    min-width: auto;
  }
}
</style> 