export async function ensurePushSubscribed() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
  
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return
  
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) return
  
    const vapidPublic = import.meta.env.VITE_VAPID_PUBLIC_KEY
    const appServerKey = urlBase64ToUint8Array(vapidPublic)
  
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey
    })
  
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-push-secret': import.meta.env.VITE_PUSH_SECRET
      },
      body: JSON.stringify({ subscription: sub, tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
    })
  }
  
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }
  