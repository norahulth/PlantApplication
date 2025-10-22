// src/sw.js
import { precacheAndRoute } from 'workbox-precaching'

// 👇 EXACTLY ONE occurrence of this placeholder
precacheAndRoute(self.__WB_MANIFEST)

// ---- your custom code below ----
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch {}
  const title = data.title || 'Plant Application'
  const options = {
    body: data.body || 'New update',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
