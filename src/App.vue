<template>
  <div class="app-shell">
    <router-view />

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

export default {
  name: "App",
  components: {},
  data: () => ({}),
  mounted() {},
  methods: {
    redirect(target) {
      this.$router.push(target).catch((e) => console.log(e.message));
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
</style>