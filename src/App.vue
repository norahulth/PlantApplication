<template>
  <div class="app-shell">
    <router-view />

    <div v-if="showPushPrompt" class="push-banner">
      <span>Enable daily plant reminders?</span>
      <div class="actions">
        <button class="btn btn-success btn-sm" @click="enablePush">Enable</button>
        <button class="btn btn-link btn-sm text-light" @click="dismissPush">Not now</button>
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
import { ensurePushSubscribed } from './push.js';

export default {
  name: "App",
  data() {
    return {
      showPushPrompt: false
    };
  },
  mounted() {
    // Show the banner only if notifications aren’t granted yet
    if (typeof window !== "undefined" && "Notification" in window) {
      const alreadyAsked = localStorage.getItem("pushPromptDismissed") === "1";
      this.showPushPrompt = !alreadyAsked && Notification.permission !== "granted";
    }
  },
  methods: {
    redirect(target) {
      this.$router.push(target).catch((e) => console.log(e.message));
    },

    async enablePush() {
      const result = await ensurePushSubscribed();
      // hide if granted or already subscribed
      if (result?.ok || result?.status === "granted" || result?.status === "already") {
        this.showPushPrompt = false;
        localStorage.setItem("pushPromptDismissed", "1");
      } else {
        // If user blocked or closed prompt, don’t nag until next visit
        this.showPushPrompt = false;
        localStorage.setItem("pushPromptDismissed", "1");
        console.warn("[push] Not enabled:", result);
      }
    },

    dismissPush() {
      this.showPushPrompt = false;
      localStorage.setItem("pushPromptDismissed", "1");
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

.push-banner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center horizontally + vertically */
  background: #ffffff;              /* white background */
  color: #1f2937;                   /* dark text */
  padding: 24px 28px;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;           /* stack text and buttons */
  gap: 16px;
  align-items: center;
  text-align: center;
  max-width: 90%;
  width: 320px;
  z-index: 9999;
}

/* Style for the text and buttons */
.push-banner span {
  font-size: 1.1rem;
  font-weight: 600;
}

.push-banner .actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.push-banner button {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.push-banner .btn-success {
  background: #4caf50;
  color: white;
}

.push-banner .btn-success:hover {
  background: #3e9143;
}

.push-banner .btn-link {
  background: transparent;
  color: #6b7280;
  text-decoration: underline;
}
</style>
