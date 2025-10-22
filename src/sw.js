import { precacheAndRoute } from 'workbox-precaching'
self.__WB_MANIFEST && precacheAndRoute(self.__WB_MANIFEST)

// receive push and show a notification
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {}
  const title = data.title || 'PlantApplication'
  const options = {
    body: data.body || 'New update',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
