<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PWAInstallButton from './PWAInstallButton.vue'
import apiService from '../services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Mobile menu toggle
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// User dropdown toggle
const showUserDropdown = ref(false)

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const closeUserDropdown = () => {
  showUserDropdown.value = false
}

const handleLogout = async () => {
  await authStore.logout()
  showUserDropdown.value = false
  router.push('/login')
}

// Inbox/Notifications state
const unreadCount = ref(0)
let notificationInterval = null

// Fetch unread notifications count
const fetchUnreadCount = async () => {
  if (!authStore.isLoggedIn) return
  
  try {
    const response = await apiService.notifications.getUnreadCount()
    unreadCount.value = response.data.ongelezen_count || response.data.data?.ongelezen_count || 0
  } catch (error) {
    console.error('Fout bij ophalen ongelezen berichten:', error)
    // Fail silently - don't show errors for background requests
  }
}

// Navigate to inbox/notifications
const goToInbox = () => {
  router.push('/notifications')
  closeMobileMenu()
}

// Navigation items
const navigationItems = [
  {
    name: 'Items',
    path: '/',
    icon: '🏠',
    description: 'Alle items bekijken'
  },
  {
    name: 'Nieuw Item',
    path: '/add-item',
    icon: '➕',
    description: 'Item toevoegen'
  },
  {
    name: 'Mijn Items',
    path: '/my-items',
    icon: '📦',
    description: 'Mijn items beheren'
  },
  {
    name: 'Mijn Reserveringen',
    path: '/my-reservations',
    icon: '📅',
    description: 'Reserveringen bekijken'
  },
  {
    name: 'Profiel',
    path: '/profile',
    icon: '👤',
    description: 'Profiel instellingen'
  }
]

// Computed property for inbox display
const inboxDisplay = computed(() => {
  return `Inbox`
})

// Check if route is active
const isActiveRoute = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Navigate to route
const navigateTo = (path) => {
  router.push(path)
  closeMobileMenu()
}

// Setup and cleanup
onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchUnreadCount()
    // Refresh every 30 seconds
    notificationInterval = setInterval(fetchUnreadCount, 30000)
  }
})

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
  }
})

const searchQuery = ref('');
</script>

<template>
  <nav class="navigation-menu" @click="closeUserDropdown">
    <!-- Desktop Navigation -->
    <div class="desktop-nav">
      <div class="nav-container">
        <div class="nav-items">
          <div class="nav-main-items">
            <button
              v-for="item in navigationItems"
              :key="item.path"
              @click="navigateTo(item.path)"
              :class="['nav-item', { 'active': isActiveRoute(item.path) }]"
              :title="item.description"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
            </button>
            
            <!-- Inbox Button -->
            <button
              @click="goToInbox"
              :class="['nav-item', 'inbox-item', { 'active': isActiveRoute('/notifications') }]"
              title="Berichten en notificaties"
            >
              <span class="nav-icon">📧</span>
              <span class="nav-text">{{ inboxDisplay }}</span>
              <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
            </button>
          </div>
          
          <!-- User Section & PWA Install Button -->
          <div class="nav-right-section">
            <!-- User Dropdown -->
            <div class="nav-user-section">
              <div class="nav-user-dropdown" @click.stop>
                <button @click="toggleUserDropdown" class="nav-user-btn">
                  <span>{{ authStore.userName || authStore.userEmail }}</span>
                  <svg 
                    :class="{ 'rotate': showUserDropdown }" 
                    width="16" 
                    height="16" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 11.5L3.5 7h9L8 11.5z"/>
                  </svg>
                </button>
                
                <div v-if="showUserDropdown" class="nav-dropdown-menu">
                  <div class="nav-dropdown-header">
                    <p class="nav-user-name">{{ authStore.userName }}</p>
                    <p class="nav-user-email">{{ authStore.userEmail }}</p>
                  </div>
                  <div class="nav-dropdown-divider"></div>
                  <button @click="handleLogout" class="nav-dropdown-item logout">
                    Uitloggen
                  </button>
                </div>
              </div>
            </div>
            
            <!-- PWA Install Button -->
            <div class="nav-pwa-container">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav">
      <!-- Mobile Menu Button -->
      <button @click="toggleMobileMenu" class="mobile-menu-btn" :class="{ 'active': isMobileMenuOpen }">
        <div class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="menu-text">Menu</span>
      </button>

      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="mobile-menu-header">
            <h3>Navigatie</h3>
            <button @click="closeMobileMenu" class="close-btn">&times;</button>
          </div>
          
          <div class="mobile-menu-items">
            <button
              v-for="item in navigationItems"
              :key="item.path"
              @click="navigateTo(item.path)"
              :class="['mobile-nav-item', { 'active': isActiveRoute(item.path) }]"
            >
              <span class="mobile-nav-icon">{{ item.icon }}</span>
              <div class="mobile-nav-content">
                <span class="mobile-nav-text">{{ item.name }}</span>
                <span class="mobile-nav-description">{{ item.description }}</span>
              </div>
            </button>
            
            <!-- Mobile Inbox Item -->
            <button
              @click="goToInbox"
              :class="['mobile-nav-item', 'mobile-inbox-item', { 'active': isActiveRoute('/notifications') }]"
            >
              <span class="mobile-nav-icon">📧</span>
              <div class="mobile-nav-content">
                <span class="mobile-nav-text">{{ inboxDisplay }}</span>
                <span class="mobile-nav-description">Berichten en notificaties</span>
              </div>
              <span v-if="unreadCount > 0" class="mobile-unread-badge">{{ unreadCount }}</span>
            </button>
            <main>
            <input
                class="input"
                name="text"
                placeholder="Search..."
                type="search"
                v-model="searchQuery"
            />
            <router-view :search="searchQuery" />
            </main>
                          <!-- PWA Install Button for Mobile -->
            <div class="mobile-pwa-container">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action Floating Button (Mobile) -->
    <div class="floating-action">
      <button @click="navigateTo('/add-item')" class="fab" title="Nieuw item toevoegen">
        <span class="fab-icon">➕</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
main {
  padding-top: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.navigation-menu {
  position: relative;
}

/* Desktop Navigation */
.desktop-nav {
  display: block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 80px;
  z-index: 50;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  gap: 20px;
}

.nav-main-items {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-decoration: none;
  min-width: 140px;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-icon {
  font-size: 1.1em;
}

.nav-text {
  font-size: 0.9em;
}

.inbox-item {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.7em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.nav-right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-user-section {
  position: relative;
}

.nav-user-dropdown {
  position: relative;
}

.nav-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.nav-user-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-user-btn svg {
  transition: transform 0.2s;
}

.nav-user-btn svg.rotate {
  transform: rotate(180deg);
}


.nav-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
}

.nav-dropdown-header {
  padding: 12px 16px;
}

.nav-user-name {
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
  font-size: 0.9em;
}

.nav-user-email {
  color: #6b7280;
  margin: 0;
  font-size: 0.8em;
}

.nav-dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0;
}

.nav-dropdown-item {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 12px 16px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9em;
}

.nav-dropdown-item:hover {
  background: #f9fafb;
}

.nav-dropdown-item.logout {
  color: #dc2626;
}

.nav-dropdown-item.logout:hover {
  background: #fef2f2;
}

.nav-pwa-container {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color:#3b82f6;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.mobile-menu-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hamburger span {
  width: 20px;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-menu-btn.active .hamburger span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-menu-btn.active .hamburger span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active .hamburger span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.menu-text {
  font-size: 0.75em;
  font-weight: 500;
}

/* Mobile Menu Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

.mobile-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-menu-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.mobile-menu-items {
  padding: 10px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.mobile-nav-item:hover {
  background: #f8fafc;
}

.mobile-nav-item.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.mobile-nav-icon {
  font-size: 1.5em;
  width: 40px;
  text-align: center;
}

.mobile-nav-content {
  flex: 1;
}

.mobile-nav-text {
  display: block;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.mobile-nav-description {
  display: block;
  font-size: 0.85em;
  color: #6b7280;
}

.mobile-nav-item.active .mobile-nav-text {
  color: #1d4ed8;
}

.mobile-inbox-item {
  position: relative;
}

.mobile-inbox-item .mobile-unread-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mobile-pwa-container {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
}

/* Floating Action Button */
.floating-action {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.fab {
  width: 56px;
  height: 56px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
  background: #2563eb;
}

.fab-icon {
  font-size: 1.5em;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }
  
  .mobile-nav {
    display: block;
  }
  
  .floating-action {
    display: block;
  }
  
  .nav-items {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .nav-main-items {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .nav-item {
    min-width: auto;
    width: 100%;
    justify-content: flex-start;
    padding: 12px 16px;
  }
  
  .nav-right-section {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .nav-user-btn span {
    display: none;
  }
  
  .nav-dropdown-menu {
    right: -10px;
  }
  
  .nav-pwa-container {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 16px;
    background: rgba(255, 255, 255, 0.05);
  }
}

/* Large desktop */
@media (min-width: 1024px) {
  .nav-item {
    padding: 14px 20px;
  }
  
  .nav-text {
    font-size: 1em;
  }
}
</style> <script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PWAInstallButton from './PWAInstallButton.vue'

const route = useRoute()
const router = useRouter()

// Mobile menu toggle
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Navigation items
const navigationItems = [
  {
    name: 'Items',
    path: '/',
    icon: '🏠',
    description: 'Alle items bekijken'
  },
  {
    name: 'Nieuw Item',
    path: '/add-item',
    icon: '➕',
    description: 'Item toevoegen'
  },
  {
    name: 'Mijn Items',
    path: '/my-items',
    icon: '📦',
    description: 'Mijn items beheren'
  },
  {
    name: 'Mijn Reserveringen',
    path: '/my-reservations',
    icon: '📅',
    description: 'Reserveringen bekijken'
  },
  {
    name: 'Profiel',
    path: '/profile',
    icon: '👤',
    description: 'Profiel instellingen'
  }
]

// Check if route is active
const isActiveRoute = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Navigate to route
const navigateTo = (path) => {
  router.push(path)
  closeMobileMenu()
}
</script>

<template>
  <nav class="navigation-menu">
    <!-- Desktop Navigation -->
    <div class="desktop-nav">
      <div class="nav-container">
        <div class="nav-items">
          <div class="nav-main-items">
            <button
              v-for="item in navigationItems"
              :key="item.path"
              @click="navigateTo(item.path)"
              :class="['nav-item', { 'active': isActiveRoute(item.path) }]"
              :title="item.description"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
            </button>
          </div>
          <!-- PWA Install Button -->
          <div class="nav-pwa-container">
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav">
      <!-- Mobile Menu Button -->
      <button @click="toggleMobileMenu" class="mobile-menu-btn" :class="{ 'active': isMobileMenuOpen }">
        <div class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="menu-text">Menu</span>
      </button>

      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="mobile-menu-header">
            <h3>Navigatie</h3>
            <button @click="closeMobileMenu" class="close-btn">&times;</button>
          </div>

          <div class="mobile-menu-items">
            <button
              v-for="item in navigationItems"
              :key="item.path"
              @click="navigateTo(item.path)"
              :class="['mobile-nav-item', { 'active': isActiveRoute(item.path) }]"
            >
              <span class="mobile-nav-icon">{{ item.icon }}</span>
              <div class="mobile-nav-content">
                <span class="mobile-nav-text">{{ item.name }}</span>
                <span class="mobile-nav-description">{{ item.description }}</span>
              </div>
            </button>

            <!-- PWA Install Button for Mobile -->
            <div class="mobile-pwa-container">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action Floating Button (Mobile) -->
    <div class="floating-action">
      <button @click="navigateTo('/add-item')" class="fab" title="Nieuw item toevoegen">
        <span class="fab-icon">➕</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navigation-menu {
  position: relative;
}

/* Desktop Navigation */
.desktop-nav {
  display: block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 80px;
  z-index: 50;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  gap: 20px;
}

.nav-main-items {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-decoration: none;
  min-width: 140px;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-icon {
  font-size: 1.1em;
}

.nav-text {
  font-size: 0.9em;
}

.nav-pwa-container {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.mobile-menu-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hamburger span {
  width: 20px;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-menu-btn.active .hamburger span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-menu-btn.active .hamburger span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active .hamburger span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.menu-text {
  font-size: 0.75em;
  font-weight: 500;
}

/* Mobile Menu Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

.mobile-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-menu-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.mobile-menu-items {
  padding: 10px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.mobile-nav-item:hover {
  background: #f8fafc;
}

.mobile-nav-item.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.mobile-nav-icon {
  font-size: 1.5em;
  width: 40px;
  text-align: center;
}

.mobile-nav-content {
  flex: 1;
}

.mobile-nav-text {
  display: block;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.mobile-nav-description {
  display: block;
  font-size: 0.85em;
  color: #6b7280;
}

.mobile-nav-item.active .mobile-nav-text {
  color: #1d4ed8;
}

.mobile-pwa-container {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
}

/* Floating Action Button */
.floating-action {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.fab {
  width: 56px;
  height: 56px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
  background: #2563eb;
}

.fab-icon {
  font-size: 1.5em;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }

  .mobile-nav {
    display: block;
  }

  .floating-action {
    display: block;
  }

  .nav-items {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .nav-main-items {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .nav-item {
    min-width: auto;
    width: 100%;
    justify-content: flex-start;
    padding: 12px 16px;
  }

  .nav-pwa-container {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 16px;
    background: rgba(255, 255, 255, 0.05);
  }
}

/* Large desktop */
@media (min-width: 1024px) {
  .nav-item {
    padding: 14px 20px;
  }

  .nav-text {
    font-size: 1em;
  }
}
</style>+
