/* global self */
self.addEventListener('push', (event) => {
    let data = {}
    try { data = event.data ? event.data.json() : {} } catch (e) {}
  
    const title = data.title || 'Plant reminder'
    const body  = data.body  || 'Time to water your plants 🌱'
    const tag   = data.tag   || 'daily-water'
  
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        renotify: true,
        data: data.data || {}
      })
    )
  })
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = '/'
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
        const existing = cs.find(c => c.url.includes(url))
        return existing ? existing.focus() : self.clients.openWindow(url)
      })
    )
  })
  