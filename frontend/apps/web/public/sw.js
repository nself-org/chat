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

// =============================================================================
// Push Notifications
// =============================================================================

/**
 * Push notification event handler
 * Receives push messages and shows notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')

  let data = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {},
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.notification_id || data.tag,
        data: {
          notification_id: payload.notification_id,
          action_url: payload.action_url || payload.url || '/',
          channel_id: payload.channel_id,
          message_id: payload.message_id,
          type: payload.type,
          ...payload.data,
        },
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200],
      }
    } catch (e) {
      // If not JSON, use as body text
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    vibrate: data.vibrate,
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

/**
 * Notification click event handler
 * Opens the appropriate URL when a notification is clicked
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.notification.tag)

  const notification = event.notification
  const data = notification.data || {}
  const action = event.action

  notification.close()

  // Determine URL to open
  let url = data.action_url || '/'

  // Handle action buttons
  if (action === 'view') {
    url = data.action_url || '/'
  } else if (action === 'dismiss') {
    // Just close the notification
    return
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }

        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
      .then(() => {
        // Notify the app that notification was clicked
        return clients.matchAll({ type: 'window' }).then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_NOTIFICATION_CLICKED',
              notification_id: data.notification_id,
              action,
              data,
            })
          })
        })
      })
  )
})

/**
 * Notification close event handler
 * Tracks when notifications are dismissed
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed', event.notification.tag)

  const data = event.notification.data || {}

  // Notify the app that notification was closed
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      windowClients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_CLOSED',
          notification_id: data.notification_id,
          data,
        })
      })
    })
  )
})

/**
 * Push subscription change event handler
 * Handles subscription refresh when keys change
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed')

  event.waitUntil(
    // Get the new subscription
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Notify the app to update the subscription on the server
      return clients.matchAll({ type: 'window' }).then((windowClients) => {
        windowClients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
              keys: {
                p256dh: btoa(
                  String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))
                ),
                auth: btoa(
                  String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))
                ),
              },
            },
          })
        })
      })
    })
  )
})

/**
 * Message event handler
 * Receives messages from the main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key.startsWith('nchat-')).map((key) => caches.delete(key))
        )
      })
    )
  }
})

// =============================================================================
// Background Sync
// =============================================================================

/**
 * Background Sync event handler
 * Syncs pending data when network connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  } else if (event.tag === 'sync-uploads') {
    event.waitUntil(syncUploads())
  } else if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings())
  } else if (event.tag === 'sync-all') {
    event.waitUntil(syncAll())
  }
})

/**
 * Sync pending messages
 */
async function syncMessages() {
  try {
    console.log('[SW] Syncing messages...')

    // Notify clients that sync is starting
    await notifyClients({
      type: 'SYNC_STARTED',
      category: 'messages',
    })

    // Get pending messages from IndexedDB
    const db = await openIndexedDB()
    const messages = await getQueuedMessages(db)

    if (messages.length === 0) {
      console.log('[SW] No pending messages to sync')
      return
    }

    let successCount = 0
    let failureCount = 0

    // Sync each message
    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data),
        })

        if (response.ok) {
          await removeQueuedMessage(db, message.id)
          successCount++
        } else {
          failureCount++
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error)
        failureCount++
      }
    }

    console.log(`[SW] Message sync complete: ${successCount} succeeded, ${failureCount} failed`)

    // Notify clients of sync completion
    await notifyClients({
      type: 'SYNC_COMPLETED',
      category: 'messages',
      success: successCount,
      failed: failureCount,
    })
  } catch (error) {
    console.error('[SW] Message sync failed:', error)
    await notifyClients({
      type: 'SYNC_FAILED',
      category: 'messages',
      error: error.message,
    })
  }
}

/**
 * Sync pending uploads
 */
async function syncUploads() {
  try {
    console.log('[SW] Syncing uploads...')

    await notifyClients({
      type: 'SYNC_STARTED',
      category: 'uploads',
    })

    const db = await openIndexedDB()
    const uploads = await getQueuedUploads(db)

    if (uploads.length === 0) {
      console.log('[SW] No pending uploads to sync')
      return
    }

    let successCount = 0
    let failureCount = 0

    for (const upload of uploads) {
      try {
        const formData = new FormData()
        formData.append('file', upload.file)
        formData.append('channelId', upload.channelId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          await removeQueuedUpload(db, upload.id)
          successCount++
        } else {
          failureCount++
        }
      } catch (error) {
        console.error('[SW] Failed to sync upload:', error)
        failureCount++
      }
    }

    console.log(`[SW] Upload sync complete: ${successCount} succeeded, ${failureCount} failed`)

    await notifyClients({
      type: 'SYNC_COMPLETED',
      category: 'uploads',
      success: successCount,
      failed: failureCount,
    })
  } catch (error) {
    console.error('[SW] Upload sync failed:', error)
    await notifyClients({
      type: 'SYNC_FAILED',
      category: 'uploads',
      error: error.message,
    })
  }
}

/**
 * Sync user settings
 */
async function syncSettings() {
  try {
    console.log('[SW] Syncing settings...')

    await notifyClients({
      type: 'SYNC_STARTED',
      category: 'settings',
    })

    const db = await openIndexedDB()
    const settings = await getPendingSettings(db)

    if (!settings) {
      console.log('[SW] No pending settings to sync')
      return
    }

    const response = await fetch(`/api/users/${settings.userId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    if (response.ok) {
      await clearPendingSettings(db)
      console.log('[SW] Settings synced successfully')

      await notifyClients({
        type: 'SYNC_COMPLETED',
        category: 'settings',
        success: 1,
        failed: 0,
      })
    } else {
      throw new Error('Failed to sync settings')
    }
  } catch (error) {
    console.error('[SW] Settings sync failed:', error)
    await notifyClients({
      type: 'SYNC_FAILED',
      category: 'settings',
      error: error.message,
    })
  }
}

/**
 * Sync all pending data
 */
async function syncAll() {
  try {
    console.log('[SW] Syncing all data...')
    await Promise.all([syncMessages(), syncUploads(), syncSettings()])
  } catch (error) {
    console.error('[SW] Full sync failed:', error)
  }
}

/**
 * Open IndexedDB connection
 */
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nchat-offline', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('messageQueue')) {
        db.createObjectStore('messageQueue', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('uploadQueue')) {
        db.createObjectStore('uploadQueue', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'userId' })
      }
    }
  })
}

/**
 * Get queued messages from IndexedDB
 */
async function getQueuedMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('messageQueue', 'readonly')
    const store = transaction.objectStore('messageQueue')
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Remove synced message from queue
 */
async function removeQueuedMessage(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('messageQueue', 'readwrite')
    const store = transaction.objectStore('messageQueue')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get queued uploads from IndexedDB
 */
async function getQueuedUploads(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('uploadQueue', 'readonly')
    const store = transaction.objectStore('uploadQueue')
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Remove synced upload from queue
 */
async function removeQueuedUpload(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('uploadQueue', 'readwrite')
    const store = transaction.objectStore('uploadQueue')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get pending settings
 */
async function getPendingSettings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readonly')
    const store = transaction.objectStore('settings')
    const request = store.getAll()

    request.onsuccess = () => {
      const settings = request.result
      resolve(settings.length > 0 ? settings[0] : null)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear synced settings
 */
async function clearPendingSettings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readwrite')
    const store = transaction.objectStore('settings')
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Notify all clients of sync events
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) => client.postMessage(message))
}

// =============================================================================
// Periodic Background Sync (if supported)
// =============================================================================

/**
 * Periodic sync event handler
 * Runs periodic background syncs
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag)

  if (event.tag === 'periodic-sync') {
    event.waitUntil(syncAll())
  }
})

console.log('[SW] Service worker loaded with push notification and background sync support')
