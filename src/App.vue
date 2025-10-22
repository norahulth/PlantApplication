<template>
  <div class="app-shell">
    <router-view />

  <!-- Push soft-ask -->
  <!-- Push soft-ask modal -->
<div v-if="showPushPrompt" class="push-overlay">
  <div class="push-modal" @click.stop>
    <div class="push-text">Enable daily plant reminders?</div>

    <div class="push-actions">
      <button class="btn btn-enable" @click="enablePush" :disabled="notifBusy">
        {{ notifBusy ? 'Please wait…' : 'Enable notifications' }}
      </button>
      <button class="btn btn-cancel" @click="dismissPush">Not now</button>
    </div>
  </div>
</div>



    <!-- Floating buttons -->
    <div class="fab-wrap">
      <!-- Plus button -->
      <button
        class="fab fab-add"
        @click="redirect('/addplant')"
        aria-label="Add plant"
        title="Add plant"
      >
        +
      </button>

      <!-- Home button -->
      <button
        class="fab fab-home"
        @click="redirect('/')"
        aria-label="Go home"
        title="Go home"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import "bootstrap";
import { subscribeToPush } from "./main";

const PUSH_PROMPT_KEY = "pushPromptV1";

export default {
  name: "App",
  data() {
    return {
      showPushPrompt: false,
      notifBusy: false,
      pushSupported:
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window,
    };
  },
  mounted() {
    this.maybeShowPushPrompt();
  },
  methods: {
    redirect(target) {
      this.$router.push(target).catch((e) => console.log(e.message));
    },

    async maybeShowPushPrompt() {
      if (!this.pushSupported) return;
      if (typeof Notification === "undefined") return;

      // don’t re-ask if they’ve seen it or if browser perm is already decided
      const seen = localStorage.getItem(PUSH_PROMPT_KEY);
      if (seen) return;
      if (Notification.permission !== "default") return;

      // if already subscribed, don’t show
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          localStorage.setItem(PUSH_PROMPT_KEY, "asked");
          return;
        }
      } catch (_) {}

      // small delay so it doesn’t pop instantly
      setTimeout(() => (this.showPushPrompt = true), 600);
    },

    async enablePush() {
      this.notifBusy = true;
      try {
        // Triggers system permission prompt and POSTs to /api/subscribe
        await subscribeToPush();
        localStorage.setItem(PUSH_PROMPT_KEY, "asked");
      } catch (e) {
        console.error("Push subscribe failed", e);
        // still mark as asked so we don’t nag repeatedly
        localStorage.setItem(PUSH_PROMPT_KEY, "asked");
      } finally {
        this.notifBusy = false;
        this.showPushPrompt = false;
      }
    },

    dismissPush() {
      localStorage.setItem(PUSH_PROMPT_KEY, "dismissed");
      this.showPushPrompt = false;
    },
  },
};
</script>


<style>
@import url("bootstrap/dist/css/bootstrap.css");

html,
body,
#app,
.app-shell {
  height: 100%;
  margin: 0;
  font-family: Garamond, serif;
}

/* Container for floating buttons */
.fab-wrap {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  gap: 16px;
  z-index: 999;
}

/* General FAB style */
.fab {
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* Plus button color */
.fab-add {
  background-color: #4caf50; /* green */
}

/* Home button color */
.fab-home {
  background-color: #3b82f6; /* blue */
}

/* Hover effect */
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .fab {
    transition: none;
  }
}
/* Overlay covers full screen */
.push-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

/* Modal box in the center */
.push-modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  width: min(90vw, 400px);
  padding: 24px 20px;
  text-align: center;
  animation: fadeInScale 0.25s ease;
}

.push-text {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 18px;
}

.push-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

/* Buttons */
.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.15s ease, opacity 0.15s ease;
}

.btn-enable {
  background: #4caf50;
  color: #fff;
}
.btn-enable:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #43a047;
}
.btn-enable:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e2e8f0;
  color: #0f172a;
}
.btn-cancel:hover {
  background: #cbd5e1;
}

/* subtle entrance animation */
@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>