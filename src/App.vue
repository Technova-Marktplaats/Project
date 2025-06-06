<script setup>
// Router wordt nu gebruikt voor navigatie
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>Marktplaats</h1>
    </header>
    
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
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  margin-bottom: 20px;
}

.app-header h1 {
  text-align: center;
  color: #2d3748;
  margin: 0;
  font-size: 2em;
  font-weight: 600;
}

main {
  max-width: 100%;
  margin: 0 auto;
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
