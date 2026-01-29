/**
 * Service Worker for nChat
 *
 * Implements intelligent caching strategies for offline support and performance.
 */

const CACHE_VERSION = 'v1.0.0'
const CACHE_NAMES = {
  STATIC: `nchat-static-${CACHE_VERSION}`,
  DYNAMIC: `nchat-dynamic-${CACHE_VERSION}`,
  IMAGES: `nchat-images-${CACHE_VERSION}`,
  API: `nchat-api-${CACHE_VERSION}`,
}

// Cache strategies
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('nchat-') && !Object.values(CACHE_NAMES).includes(key))
          .map((key) => caches.delete(key))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  
  const url = new URL(event.request.url)
  if (!url.protocol.startsWith('http')) return
  
  event.respondWith(handleFetch(event.request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  // Images - cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    return cacheFirst(request, CACHE_NAMES.IMAGES)
  }
  
  // API - network first
  if (url.pathname.startsWith('/api/')) {
    return networkFirst(request, CACHE_NAMES.API)
  }
  
  // Default - stale while revalidate
  return staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC)
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (e) {
    if (cached) return cached
    throw e
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (e) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) return cached
    throw e
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })
  
  return cached || fetchPromise
}

console.log('[SW] Service worker loaded')
