const CACHE_NAME = 'marktplaats-items-v1'
const API_CACHE_NAME = 'marktplaats-api-v1'
const STATIC_CACHE_NAME = 'marktplaats-static-v1'

// URLs die we willen cachen
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/vite.svg'
]

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
      // Cache statische bestanden
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static files')
        return cache.addAll(STATIC_URLS)
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
                cacheName !== STATIC_CACHE_NAME) {
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
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // API requests - Cache First strategie
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request))
    return
  }
  
  // Statische bestanden - Network First met Cache Fallback
  event.respondWith(handleStaticRequest(event.request))
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

// Static Request Handler - Network First
async function handleStaticRequest(request) {
  try {
    // Probeer network eerst
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('📱 Serving static file from cache:', request.url)
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
    
    return {
      apiCacheSize: apiKeys.length,
      staticCacheSize: staticKeys.length,
      totalCacheSize: apiKeys.length + staticKeys.length,
      cacheNames: [API_CACHE_NAME, STATIC_CACHE_NAME, CACHE_NAME]
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