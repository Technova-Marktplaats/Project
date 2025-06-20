// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'My PWA App',
        short_name: 'PWA',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        description: 'My Vue PWA App using Vite',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    /        },
          {
            src: 'pwa-512x512.png',
    / Use port 5174 for hosting otherwise it won't work
    port: 5174,
    strictPort: true,
  }


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
