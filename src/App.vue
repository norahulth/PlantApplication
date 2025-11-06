<template>
  <div class="app-shell">
    <router-view />

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

      <!-- Music button -->
      <button
        class="fab fab-music"
        @click="toggleMusic"
        :aria-label="isPlaying ? 'Mute music' : 'Play music'"
        :title="isPlaying ? 'Mute music' : 'Play music'"
      >
        <!-- Music ON icon (muted speaker) -->
        <svg
          v-if="isPlaying"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46l1.41 1.41L18.36 8.46 19.77 9.87 18.36 11.28 19.77 12.69 18.36 14.1 16.95 12.69 15.54 14.1 14.13 12.69 15.54 11.28 14.13 9.87z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
            fill="currentColor"
          />
        </svg>
        <!-- Music OFF icon (music note) -->
        <svg
          v-else
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Audio element (bind src so we can clear it when stopping) -->
    <audio ref="bgMusic" :src="musicSrc" loop></audio>
  </div>
</template>

<script>
import "bootstrap";
import { subscribeToPush } from "./main";

const PUSH_PROMPT_KEY = "pushPromptV1";
const DEFAULT_MUSIC_SRC = "/background-music.mp3";

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
      isPlaying: false,
      musicSrc: DEFAULT_MUSIC_SRC, // bound to <audio>
    };
  },
  mounted() {
    this.maybeShowPushPrompt();
    this.setupLifecycleListeners();
    this.lockOrientation();
  },
  beforeUnmount() {
    // remove listeners
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    window.removeEventListener("pagehide", this._onPageHide);
    window.removeEventListener("blur", this._onBlur);
  },
  methods: {
    redirect(target) {
      this.$router.push(target).catch((e) => console.log(e.message));
    },

    lockOrientation() {
      // Lock screen orientation to portrait on mobile devices
      if (screen?.orientation?.lock) {
        screen.orientation.lock('portrait').catch(err => {
          console.log('Orientation lock not supported or failed:', err);
        });
      }
    },

    async maybeShowPushPrompt() {
      if (!this.pushSupported) return;
      if (typeof Notification === "undefined") return;

      const seen = localStorage.getItem(PUSH_PROMPT_KEY);
      if (seen) return;
      if (Notification.permission !== "default") return;

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          localStorage.setItem(PUSH_PROMPT_KEY, "asked");
          return;
        }
      } catch (_) {}

      setTimeout(() => (this.showPushPrompt = true), 600);
    },

    async enablePush() {
      this.notifBusy = true;
      try {
        await subscribeToPush();
        localStorage.setItem(PUSH_PROMPT_KEY, "asked");
      } catch (e) {
        console.error("Push subscribe failed", e);
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

    setupLifecycleListeners() {
      // stop music whenever the app is not foregrounded / is left
      this._onVisibilityChange = () => {
        if (document.visibilityState !== "visible") this.stopMusic();
      };
      this._onPageHide = () => this.stopMusic();
      this._onBlur = () => this.stopMusic();

      document.addEventListener("visibilitychange", this._onVisibilityChange, { passive: true });
      window.addEventListener("pagehide", this._onPageHide, { passive: true });
      window.addEventListener("blur", this._onBlur, { passive: true });

      // Music will now continue playing across views until manually stopped
    },

    stopMusic() {
      const audio = this.$refs.bgMusic;
      if (!audio) return;

      // fully stop audio
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}

      // clear Media Session so iOS drops the lock-screen controls
      try {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "none";
          navigator.mediaSession.metadata = null;
          ["play","pause","seekbackward","seekforward","previoustrack","nexttrack"]
            .forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch {} });
        }
      } catch {}

      // clear src to force the OS to release the session immediately (helps on iOS PWAs)
      try {
        if (this.musicSrc) {
          this.musicSrc = ""; // unbinds audio file
          audio.load();
        }
      } catch {}

      this.isPlaying = false;
    },

    toggleMusic() {
      const audio = this.$refs.bgMusic;
      if (!audio) return;

      if (this.isPlaying) {
        this.stopMusic();
      } else {
        // restore src if we cleared it previously
        if (!this.musicSrc) {
          this.musicSrc = DEFAULT_MUSIC_SRC;
          audio.load();
        }
        audio.currentTime = 0;

        audio.play().then(() => {
          // optional: set minimal media session metadata while playing
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
            try {
              navigator.mediaSession.metadata = new MediaMetadata({ title: "PlantApp" });
            } catch {}
          }
          this.isPlaying = true;
        }).catch(err => {
          console.warn("Audio play failed:", err);
          this.isPlaying = false;
        });
      }
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
  background: #839170FF;
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
  background-color: #004643;
}

/* Home button color */
.fab-home {
  background-color: #6380B8;
}

/* Music button color */
.fab-music {
  background-color: #8B5A9F;
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
  background: #4A8F66;
  color: #fff;
}
.btn-enable:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #3a7552;
}
.btn-enable:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #8897A8;
  color: #fff;
}
.btn-cancel:hover {
  background: #6d7c8d;
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