<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '../services/api'

const router = useRouter()

const notifications = ref([])
const loading = ref(false)
const error = ref(null)

const fetchNotifications = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiService.notifications.getAll()
    console.log('Notifications Response:', response.data)
    
    // Handle different response structures
    if (response.data.data && Array.isArray(response.data.data)) {
      notifications.value = response.data.data
    } else if (Array.isArray(response.data)) {
      notifications.value = response.data
    } else {
      notifications.value = []
    }
  } catch (err) {
    console.error('Fout bij ophalen notificaties:', err)
    
    if (err.response?.status === 404) {
      error.value = 'Geen notificaties gevonden.'
    } else if (err.response?.status === 500) {
      error.value = 'Server fout bij het ophalen van notificaties.'
    } else {
      error.value = 'Er is een fout opgetreden: ' + (err.response?.data?.message || err.message)
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Onbekende datum'
  return new Date(dateString).toLocaleString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'reservation':
      return '📅'
    case 'message':
      return '💬'
    case 'item':
      return '📦'
    case 'system':
      return '⚙️'
    default:
      return '📧'
  }
}

const getNotificationClass = (notification) => {
  return {
    'notification-item': true,
    'unread': !notification.read_at,
    'read': !!notification.read_at
  }
}

const markAsRead = async (notification) => {
  try {
    await apiService.notifications.markAsRead(notification.id)
    
    // Update the notification in the local list
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index !== -1) {
      notifications.value[index].read_at = new Date().toISOString()
    }
    
    console.log('Notificatie gemarkeerd als gelezen')
  } catch (err) {
    console.error('Fout bij markeren als gelezen:', err)
    alert('Fout bij markeren als gelezen: ' + (err.response?.data?.message || err.message))
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="notifications-container">
    <div class="notifications-header">
      <button @click="goBack" class="back-btn">
        ← Terug naar overzicht
      </button>
      <h1>📧 Inbox</h1>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Notificaties worden geladen...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchNotifications" class="retry-btn">Opnieuw proberen</button>
    </div>

    <div v-else class="notifications-content">
      <div v-if="notifications.length === 0" class="no-notifications">
        <div class="no-notifications-icon">📭</div>
        <h2>Geen berichten</h2>
        <p>Je hebt momenteel geen notificaties.</p>
      </div>

      <div v-else class="notifications-list">
        <div class="stats-bar">
          <span class="total-count">
            {{ notifications.length }} {{ notifications.length === 1 ? 'bericht' : 'berichten' }}
          </span>
          <span class="unread-count">
            {{ notifications.filter(n => !n.read_at).length }} ongelezen
          </span>
        </div>

        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="getNotificationClass(notification)"
        >
          <div class="notification-icon">
            {{ getNotificationIcon(notification.type) }}
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h3 class="notification-title">{{ notification.title || 'Geen titel' }}</h3>
              <span class="notification-date">{{ formatDate(notification.created_at) }}</span>
            </div>
            
            <p class="notification-message">{{ notification.message || notification.data?.message || 'Geen bericht beschikbaar' }}</p>
            
            <div class="notification-meta">
              <button 
                v-if="!notification.read_at" 
                @click="markAsRead(notification)"
                class="mark-read-btn"
                title="Markeer als gelezen"
              >
                ✓ Markeer als gelezen
              </button>
              <span v-if="!notification.read_at" class="unread-indicator">●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.notifications-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
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

.notifications-header h1 {
  margin: 0;
  color: #2d3748;
  font-size: 2em;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #4a5568;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 60px;
  color: #e53e3e;
  background: #fed7d7;
  border-radius: 12px;
  margin: 20px 0;
}

.error-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.retry-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #c53030;
}

.notifications-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-notifications {
  text-align: center;
  padding: 80px 40px;
  color: #6b7280;
}

.no-notifications-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-notifications h2 {
  margin: 0 0 10px 0;
  color: #4a5568;
}

.no-notifications p {
  margin: 0;
  font-size: 1.1em;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9em;
  color: #6b7280;
}

.total-count {
  font-weight: 500;
}

.unread-count {
  color: #dc2626;
  font-weight: 600;
}

.notifications-list {
  max-height: 70vh;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
}

.notification-item.read {
  opacity: 0.8;
}

.notification-icon {
  font-size: 1.5em;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 15px;
}

.notification-title {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.notification-date {
  color: #6b7280;
  font-size: 0.85em;
  white-space: nowrap;
  flex-shrink: 0;
}

.notification-message {
  margin: 0 0 12px 0;
  color: #4a5568;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.mark-read-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.mark-read-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.mark-read-btn:active {
  transform: translateY(0);
}

.unread-indicator {
  color: #0ea5e9;
  font-size: 1.2em;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .notifications-container {
    padding: 15px;
  }
  
  .notifications-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .notifications-header h1 {
    font-size: 1.5em;
  }
  
  .notification-item {
    padding: 15px;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .notification-title {
    font-size: 1em;
  }
  
  .notification-date {
    font-size: 0.8em;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .mark-read-btn {
    padding: 4px 8px;
    font-size: 0.75em;
  }
}
</style> 