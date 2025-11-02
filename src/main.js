import { registerSW } from 'virtual:pwa-register';
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {}
})

createApp(App).use(store).use(router).mount("#app");

store.dispatch('loadPlants');

// helper to convert the VAPID public key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return

  // Get current userId from localStorage
  const userId = localStorage.getItem('userId')

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
  })

  await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub, userId }) // Send userId with subscription
  })
}