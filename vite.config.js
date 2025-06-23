// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Marktplaats App',
        short_name: 'Marktplaats',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        description: 'Marktplaats applicatie gebouwd met Vue en Vite',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  publicDir: 'public',
  // Dev server configuratie
  server: {
    // Use port 5174 for hosting otherwise it won't work
    port: 5174,
    strictPort: true,
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