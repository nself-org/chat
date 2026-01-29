/// <reference lib="webworker" />

// nChat Service Worker
// Provides offline support, caching, background sync, and push notifications

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `nchat-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nchat-dynamic-${CACHE_VERSION}`;
const API_CACHE = `nchat-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `nchat-images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/config',
  '/v1/graphql',
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_API_CACHE_ITEMS = 100;
const MAX_IMAGE_CACHE_ITEMS = 200;

// Cache expiration times (in milliseconds)
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Background sync tag
const MESSAGE_SYNC_TAG = 'nchat-message-sync';
const REACTION_SYNC_TAG = 'nchat-reaction-sync';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('nchat-') &&
                     !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (but handle them for offline)
  if (request.method !== 'GET') {
    // For POST requests when offline, try to queue for background sync
    if (!navigator.onLine && request.method === 'POST') {
      event.respondWith(handleOfflinePost(request));
    }
    return;
  }

  // Skip cross-origin requests except for specific allowed origins
  if (url.origin !== location.origin) {
    // Allow caching of CDN resources
    if (!isAllowedCrossOrigin(url)) {
      return;
    }
  }

  // Route to appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE, API_CACHE_MAX_AGE));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_CACHE_MAX_AGE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cache is expired
    if (maxAge) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cached-at') || 0);
      if (Date.now() - cachedDate.getTime() > maxAge) {
        // Cache expired, fetch new version in background
        fetchAndCache(request, cache);
      }
    }
    return cachedResponse;
  }

  return fetchAndCache(request, cache);
}

// Network-first strategy (for API requests)
async function networkFirst(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response with timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-at', new Date().toISOString());

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      await cache.put(request, cachedResponse);
      await trimCache(cache, MAX_API_CACHE_ITEMS);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-while-revalidate strategy (for dynamic content)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        trimCache(cache, MAX_DYNAMIC_CACHE_ITEMS);
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached version immediately if available
  return cachedResponse || fetchPromise || createOfflineResponse();
}

// Network-first with offline fallback (for navigation)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, checking cache:', request.url);

    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page
    const offlineCache = await caches.open(STATIC_CACHE);
    const offlineResponse = await offlineCache.match('/offline');

    if (offlineResponse) {
      return offlineResponse;
    }

    return createOfflineResponse();
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return createOfflineResponse();
  }
}

// Trim cache to maximum size
async function trimCache(cache, maxItems) {
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(itemsToDelete.map((key) => cache.delete(key)));
  }
}

// Create offline response
function createOfflineResponse() {
  return new Response(
    '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Handle offline POST requests
async function handleOfflinePost(request) {
  // Store the request for background sync
  try {
    const requestData = await request.clone().json();

    // Store in IndexedDB for later sync
    await storeOfflineRequest({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: requestData,
      timestamp: Date.now()
    });

    // Register for background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(MESSAGE_SYNC_TAG);
    }

    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Request queued for sync when online'
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Unable to process request offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper functions for request classification
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext)) ||
         url.pathname === '/manifest.json';
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.pathname.includes('/v1/graphql') ||
         url.pathname.includes('/v1/auth');
}

function isImageRequest(request) {
  const acceptHeader = request.headers.get('Accept') || '';
  const url = new URL(request.url);
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];

  return acceptHeader.includes('image/') ||
         imageExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' &&
          request.headers.get('Accept')?.includes('text/html'));
}

function isAllowedCrossOrigin(url) {
  const allowedOrigins = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net'
  ];
  return allowedOrigins.some((origin) => url.hostname.includes(origin));
}

// IndexedDB helpers for offline storage
const DB_NAME = 'nchat-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function storeOfflineRequest(requestData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(requestData);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingRequests() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function clearPendingRequest(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === MESSAGE_SYNC_TAG || event.tag === REACTION_SYNC_TAG) {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  console.log('[SW] Syncing pending requests...');

  try {
    const pendingRequests = await getPendingRequests();

    for (const requestData of pendingRequests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: JSON.stringify(requestData.body)
        });

        if (response.ok) {
          await clearPendingRequest(requestData.id);
          console.log('[SW] Successfully synced request:', requestData.url);

          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              url: requestData.url,
              timestamp: requestData.timestamp
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Error during background sync:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'nChat',
    body: 'You have a new message',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'nchat-notification',
    renotify: true,
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.data || data
      };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  // Add actions based on notification type
  const actions = getNotificationActions(notificationData.data?.type);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      renotify: notificationData.renotify,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: actions,
      vibrate: [100, 50, 100],
      timestamp: Date.now()
    })
  );
});

function getNotificationActions(type) {
  switch (type) {
    case 'message':
      return [
        { action: 'reply', title: 'Reply', icon: '/icons/action-reply.png' },
        { action: 'mark-read', title: 'Mark as Read', icon: '/icons/action-read.png' }
      ];
    case 'mention':
      return [
        { action: 'view', title: 'View', icon: '/icons/action-view.png' },
        { action: 'reply', title: 'Reply', icon: '/icons/action-reply.png' }
      ];
    case 'reaction':
      return [
        { action: 'view', title: 'View', icon: '/icons/action-view.png' }
      ];
    default:
      return [
        { action: 'open', title: 'Open', icon: '/icons/action-open.png' }
      ];
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/chat';

  // Determine target URL based on notification data
  if (notificationData.channelId) {
    targetUrl = `/chat/channels/${notificationData.channelId}`;
    if (notificationData.messageId) {
      targetUrl += `?message=${notificationData.messageId}`;
    }
  } else if (notificationData.dmId) {
    targetUrl = `/chat/dm/${notificationData.dmId}`;
  }

  // Handle different actions
  switch (event.action) {
    case 'reply':
      targetUrl += '&action=reply';
      break;
    case 'mark-read':
      // Mark as read in background, don't navigate
      event.waitUntil(markMessageAsRead(notificationData));
      return;
    case 'view':
    case 'open':
    default:
      // Navigate to the target URL
      break;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes('/chat') && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              data: notificationData
            });
            return client.focus();
          }
        }
        // Open new window if no existing window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');

  // Track notification dismissal if needed
  const notificationData = event.notification.data || {};

  // Send analytics or update read status
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_DISMISSED',
        data: notificationData
      });
    });
  });
});

// Helper function to mark message as read
async function markMessageAsRead(data) {
  if (!data.messageId) return;

  try {
    await fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: data.messageId })
    });
  } catch (error) {
    console.error('[SW] Failed to mark message as read:', error);
  }
}

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => {
          return cache.addAll(payload.urls);
        })
      );
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => name.startsWith('nchat-'))
              .map((name) => caches.delete(name))
          );
        })
      );
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then((size) => {
          event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
        })
      );
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    if (name.startsWith('nchat-')) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }
    }
  }

  return totalSize;
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'nchat-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

async function performPeriodicSync() {
  // Sync any pending messages
  await syncPendingRequests();

  // Prefetch recent messages for offline access
  try {
    const response = await fetch('/api/messages/recent');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/messages/recent', response.clone());
    }
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

console.log('[SW] Service worker loaded');
