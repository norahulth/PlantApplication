import { registerSW } from 'virtual:pwa-register';
import { createApp } from "vue";
import App from "./App.vue";
import { ensurePushSubscribed } from './push';
import router from "./router";
import store from "./store";

registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {}
})

createApp(App).use(store).use(router).mount("#app");

ensurePushSubscribed()
