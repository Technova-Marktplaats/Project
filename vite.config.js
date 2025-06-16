// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue()
  ],
  // Zorg ervoor dat service worker bestanden geserveerd worden
  publicDir: 'public',
  // Dev server configuratie
  server: {
    // Zorg dat service worker correct wordt geserveerd in development
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  build: {
    // Zorg dat service worker niet gebundeld wordt
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
})
