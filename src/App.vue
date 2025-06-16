<script setup>
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import NavigationMenu from './components/NavigationMenu.vue'

const authStore = useAuthStore()
const router = useRouter()
const showUserDropdown = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  showUserDropdown.value = false
  router.push('/login')
}

const toggleDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// Close dropdown when clicking outside
const closeDropdown = () => {
  showUserDropdown.value = false
}
</script>

<template>
  <div id="app" @click="closeDropdown">
    <header class="app-header" v-if="authStore.isLoggedIn">
      <div class="header-content">
        <h1 @click="$router.push('/')">Marktplaats</h1>

        <div class="user-section">
          <div class="user-dropdown" @click.stop>
            <button @click="toggleDropdown" class="user-btn">
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

            <div v-if="showUserDropdown" class="dropdown-menu">
              <div class="dropdown-header">
                <p class="user-name">{{ authStore.userName }}</p>
                <p class="user-email">{{ authStore.userEmail }}</p>
              </div>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout">
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation Menu -->
    <NavigationMenu v-if="authStore.isLoggedIn" />

    <main>
      <!-- From Uiverse.io by alexruix -->
      <input class="input" name="text" placeholder="Search..." type="search">
      <router-view />

    </main>

 </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: #f8fafc;
}

.app-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  color: #2d3748;
  margin: 0;
  font-size: 2em;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.app-header h1:hover {
  color: #4f46e5;
}

.user-section {
  position: relative;
}

.user-dropdown {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  color: #2d3748;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.user-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.user-btn svg {
  transition: transform 0.2s;
}

.user-btn svg.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
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

.dropdown-header {
  padding: 12px 16px;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
  font-size: 0.9em;
}

.user-email {
  color: #6b7280;
  margin: 0;
  font-size: 0.8em;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0;
}

.dropdown-item {
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

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

main {
  padding-top: 20px;
  max-width: 100%;
  margin: 0 auto;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }

  .app-header h1 {
    font-size: 1.5em;
  }

  .user-btn span {
    display: none;
  }

  .dropdown-menu {
    right: -10px;
  }
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

/* From Uiverse.io by alexruix */
.input {
  max-width: 190px;
  background-color: #f5f5f5;
  color: #242424;
  padding: .15rem .5rem;
  min-height: 40px;
  border-radius: 4px;
  outline: none;
  border: none;
  line-height: 1.15;
  box-shadow: 0px 10px 20px -18px;
}

input:focus {
  border-bottom: 2px solid #5b5fc7;
  border-radius: 4px 4px 2px 2px;
}

input:hover {
  outline: 1px solid lightgrey;
}
</style>