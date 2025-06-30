const CACHE_NAME = 'marktplaats-items-v2'
const API_CACHE_NAME = 'marktplaats-api-v2'
const STATIC_CACHE_NAME = 'marktplaats-static-v2'
const RUNTIME_CACHE_NAME = 'marktplaats-runtime-v2'

// URLs die we altijd willen cachen (App Shell)
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/vite.svg'
]

// Regex patterns voor verschillende asset types
const ASSET_PATTERNS = {
  js: /\.(js|mjs)$/,
  css: /\.css$/,
  images: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  fonts: /\.(woff|woff2|eot|ttf|otf)$/
}

// API endpoints die we willen cachen
const API_ENDPOINTS = [
  '/api/items',
  '/api/categories'
]

// Service Worker installatie
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache app shell (basic files)
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        console.log('📦 Caching app shell files')
        try {
          await cache.addAll(STATIC_URLS)
          console.log('✅ App shell cached successfully')
        } catch (error) {
          console.error('❌ Failed to cache some app shell files:', error)
          // Cache files individually to avoid failing on missing files
          for (const url of STATIC_URLS) {
            try {
              await cache.add(url)
            } catch (e) {
              console.warn('⚠️ Could not cache:', url, e.message)
            }
          }
        }
      }),
      
      // Skip waiting om direct actief te worden
      self.skipWaiting()
    ])
  )
})

// Service Worker activatie
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Verwijder oude caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Claim alle clients
      self.clients.claim()
    ])
  )
})

// Fetch event handler voor caching strategie
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  // API requests - Cache First strategie
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request))
    return
  }
  
  // Navigation requests (HTML pages) - App Shell strategie
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request))
    return
  }
  
  // Static assets - Cache First met Network Fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAssetRequest(event.request))
    return
  }
  
  // Overige requests - Network First met Cache Fallback
  event.respondWith(handleOtherRequest(event.request))
})

// API Request Handler - Cache First
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Probeer eerst uit cache
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    // Voor items API, gebruik altijd cache als beschikbaar (offline-first)
    if (cachedResponse && (url.pathname === '/api/items' || url.pathname.startsWith('/api/items/'))) {
      console.log('📱 Serving items from cache:', request.url)
      
      // Update cache in background
      updateCacheInBackground(request, cache)
      
      return cachedResponse
    }
    
    // Voor andere API calls, probeer network eerst
    try {
      console.log('🌐 Fetching from network:', request.url)
      const networkResponse = await fetch(request)
      
      // Cache successful responses
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone()
        cache.put(request, responseClone)
        console.log('💾 Cached API response:', request.url)
      }
      
      return networkResponse
    } catch (networkError) {
      // Network failed, return cached version if available
      if (cachedResponse) {
        console.log('📱 Network failed, serving from cache:', request.url)
        return cachedResponse
      }
      
      // No cache available, return offline message
      return createOfflineResponse(url.pathname)
    }
    
  } catch (error) {
    console.error('❌ Cache error:', error)
    return fetch(request)
  }
}

// Helper function to check if request is for static asset
function isStaticAsset(pathname) {
  return ASSET_PATTERNS.js.test(pathname) ||
         ASSET_PATTERNS.css.test(pathname) ||
         ASSET_PATTERNS.images.test(pathname) ||
         ASSET_PATTERNS.fonts.test(pathname) ||
         pathname.startsWith('/assets/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico')
}

// Navigation Request Handler - App Shell Pattern
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request)
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, serve app shell (index.html)
    console.log('📱 Navigation offline, serving app shell for:', request.url)
    
    // Try to get cached version first
    const cache = await caches.open(RUNTIME_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to app shell
    const appShellCache = await caches.open(STATIC_CACHE_NAME)
    const appShell = await appShellCache.match('/index.html') || 
                     await appShellCache.match('/')
    
    if (appShell) {
      return appShell
    }
    
    // Last resort: create offline page
    return createOfflinePageResponse()
  }
}

// Static Asset Handler - Cache First
async function handleStaticAssetRequest(request) {
  try {
    // Check cache first
    const cache = await caches.open(RUNTIME_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('📱 Serving static asset from cache:', request.url)
      
      // Update cache in background if it's older than 1 hour
      updateCacheInBackground(request, cache)
      
      return cachedResponse
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
      console.log('💾 Cached static asset:', request.url)
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try static cache as fallback
    const staticCache = await caches.open(STATIC_CACHE_NAME)
    const staticResponse = await staticCache.match(request)
    
    if (staticResponse) {
      console.log('📱 Serving from static cache:', request.url)
      return staticResponse
    }
    
    throw error
  }
}

// Other Request Handler - Network First
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(RUNTIME_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('📱 Serving other request from cache:', request.url)
      return cachedResponse
    }
    
    // No cache available
    throw error
  }
}

// Update cache in background without blocking response
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
      console.log('🔄 Background cache update completed:', request.url)
    }
  } catch (error) {
    console.log('⚠️ Background cache update failed:', error)
  }
}

// Create offline response voor API calls
function createOfflineResponse(pathname) {
  const offlineData = {
    success: false,
    message: 'Offline - geen internetverbinding',
    data: [],
    offline: true
  }
  
  // Voor items endpoint, return lege array
  if (pathname === '/api/items' || pathname.startsWith('/api/items/')) {
    offlineData.data = []
    offlineData.message = 'Items niet beschikbaar offline'
  }
  
  return new Response(JSON.stringify(offlineData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// Create offline page response
function createOfflinePageResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Marktplaats</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8fafc;
          color: #2d3748;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .offline-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }
        h1 {
          color: #2d3748;
          margin-bottom: 10px;
        }
        p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .retry-btn {
          background: #4299e1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 500;
        }
        .retry-btn:hover {
          background: #3182ce;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📵</div>
        <h1>Offline</h1>
        <p>Je bent momenteel offline. Controleer je internetverbinding en probeer opnieuw.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Opnieuw proberen
        </button>
      </div>
    </body>
    </html>
  `
  
  return new Response(offlineHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  })
}

// Message handler voor cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'CACHE_ITEMS':
        // Cache items data manually
        cacheItemsData(event.data.items)
        break
        
      case 'CLEAR_CACHE':
        // Clear all caches
        clearAllCaches()
        break
        
      case 'GET_CACHE_STATUS':
        // Return cache status
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status)
        })
        break
        
      case 'SYNC_DATA':
        // Sync data when back online
        console.log('🔄 Sync data triggered - refreshing caches')
        syncDataWhenOnline()
        break
        
      case 'SKIP_WAITING':
        // Force update service worker
        self.skipWaiting()
        break
    }
  }
})

// Cache items data manually
async function cacheItemsData(items) {
  try {
    if (!items || !Array.isArray(items)) {
      console.warn('⚠️ Invalid items data for caching:', items)
      return
    }
    
    const cache = await caches.open(API_CACHE_NAME)
    
    // Cache de items response
    const itemsResponse = new Response(JSON.stringify({
      success: true,
      data: items
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600'
      }
    })
    
    await cache.put('/api/items', itemsResponse)
    console.log('💾 Successfully cached', items.length, 'items')
    
    // Cache ook individuele items
    for (const item of items) {
      if (item.id) {
        const itemResponse = new Response(JSON.stringify({
          success: true,
          data: item
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=3600'
          }
        })
        
        await cache.put(`/api/items/${item.id}`, itemResponse)
      }
    }
    
    console.log('💾 Cached individual items as well')
  } catch (error) {
    console.error('❌ Failed to manually cache items:', error)
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('🗑️ All caches cleared')
  } catch (error) {
    console.error('❌ Failed to clear caches:', error)
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const apiCache = await caches.open(API_CACHE_NAME)
    const staticCache = await caches.open(STATIC_CACHE_NAME)
    
    const apiKeys = await apiCache.keys()
    const staticKeys = await staticCache.keys()
    
    const runtimeCache = await caches.open(RUNTIME_CACHE_NAME)
    const runtimeKeys = await runtimeCache.keys()
    
    return {
      apiCacheSize: apiKeys.length,
      staticCacheSize: staticKeys.length,
      runtimeCacheSize: runtimeKeys.length,
      totalCacheSize: apiKeys.length + staticKeys.length + runtimeKeys.length,
      cacheNames: [API_CACHE_NAME, STATIC_CACHE_NAME, RUNTIME_CACHE_NAME, CACHE_NAME]
    }
  } catch (error) {
    return { error: error.message }
  }
}

// Sync data when coming back online
async function syncDataWhenOnline() {
  try {
    // Refresh cache for main API endpoints
    const cache = await caches.open(API_CACHE_NAME)
    
    // Try to fetch fresh data for items
    try {
      const itemsResponse = await fetch('/api/items')
      if (itemsResponse.ok) {
        await cache.put('/api/items', itemsResponse.clone())
        console.log('🔄 Items cache bijgewerkt na online komen')
      }
    } catch (error) {
      console.log('⚠️ Could not sync items:', error)
    }
    
    // Notify all clients about the sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().toISOString()
      })
    })
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
} 