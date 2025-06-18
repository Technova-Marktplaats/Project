<script setup>
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
