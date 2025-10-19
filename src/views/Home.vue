<template>
  <!-- Fullscreen, scrollable image -->
  <div class="bg-pan">
    <img
      class="pan-img"
      src="/background.jpg"
      alt="Cozy room"
      draggable="false"
    />
  </div>
</template>

<script>
export default { name: "Home" };
</script>

<style scoped>
/* Fill screen and allow momentum scroll on iOS */
.bg-pan {
  position: fixed;
  inset: 0;                       /* top:0 right:0 bottom:0 left:0 */
  overflow: auto;                 /* enables horizontal scroll */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;   /* reduces rubber-band on iOS */
  touch-action: pan-x pan-y;      /* smooth touch panning */
  background: #f8fafc;            /* optional backdrop */
}

/* Wide image: fit height, keep natural width => horizontal scroll */
.pan-img {
  display: block;
  height: 100vh;   /* full screen height */
  width: auto;     /* keep natural width so it’s wider than the screen */
  max-width: none; /* don't shrink */
  user-select: none;
  pointer-events: none; /* prevents long-press saving on iOS; remove if needed */
}

/* Optional: prevent the page behind from scrolling */
:global(html), :global(body) {
  height: 100%;
  overflow: hidden;
}
</style>
