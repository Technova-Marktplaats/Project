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
</style>
