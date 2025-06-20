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
  server: {
    // Force to use port 5174 instead of 5173 to not have it crash with the database
    port: 5174,
    strictPort: true,
  }
})
