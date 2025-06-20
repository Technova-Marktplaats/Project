<script setup>
import { useAuthStore } from './stores/auth'
import NavigationMenu from './components/NavigationMenu.vue'

const authStore = useAuthStore()

</script>

<template>
  <div id="app">
    <header class="app-header" v-if="authStore.isLoggedIn">
      <div class="header-content">
        <h1 @click="$router.push('/')">Marktplaats</h1>
      </div>
    </header>
    
    <!-- Navigation Menu -->
    <NavigationMenu v-if="authStore.isLoggedIn" />
    
    <main>
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
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
  padding: 30px;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-header h1 {
  color: white;
  margin: 0;
  font-size: 2.5em;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
  position: relative;
}

.app-header h1:hover {
  transform: translateY(-2px);
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  filter: brightness(1.1);
}

.app-header h1::after {
  content: '';
  position: absolute;
  width: 0;
  height: 3px;
  bottom: -8px;
  left: 50%;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  transform: translateX(-50%);
  border-radius: 2px;
}

.app-header h1:hover::after {
  width: 100%;
}



main {
  padding-top: 20px;
  max-width: 100%;
  margin: 0 auto;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .app-header {
    padding: 20px 0;
  }
  
  .header-content {
    padding: 0 15px;
  }
  
  .app-header h1 {
    font-size: 2em;
    font-weight: 600;
  }
  
  .app-header h1:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 15px 0;
  }
  
  .app-header h1 {
    font-size: 1.8em;
  }
}

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