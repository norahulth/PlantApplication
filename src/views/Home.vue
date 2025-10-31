<template>
  <div class="bg-pan" :class="{ dragging: isDragging }" @click="closeActions">
    <div
      class="room"
      :style="{ width: roomWidth + 'px', height: roomHeight + 'px' }"
      @pointerdown="onRoomPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
    >
      <img
        ref="bg"
        class="pan-img"
        src="/background.png"
        alt="Cozy room"
        draggable="false"
        @load="onBgLoad"
      />

      <!-- Plants -->
      <div
        v-for="p in plants"
        :key="p.id"
        class="plant"
        :class="{ movable: draggingId === p.id }"
        :style="{ left: p.x + '%', top: p.y + '%' }"
        :title="`${p.name} (${p.species})`"
        @click.stop="openActions(p.id)"
        @pointerdown.stop="beginDrag(p.id, $event)"
      >
        <!-- Water callout (only when unwatered) -->
        <div v-if="!p.watered" class="callout">
          Water me 😢
        </div>

        <img class="pot" :src="p.image" :alt="p.name" />
        <div class="label">
          <div class="name">{{ p.name }}</div>
          <div class="species">{{ p.species }}</div>
        </div>

        <!-- Action menu -->
        <div v-if="actionId === p.id" class="action-menu" @click.stop>
          <button class="action-btn" @click="waterPlant(p.id)" title="Water">💧</button>
          <button class="action-btn" @click="enableMove(p.id)" title="Move">↔️</button>
          <button class="action-btn danger" @click="deletePlant(p.id)" title="Delete">✖️</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
// Minimum distance from edges (in px)
const EDGE_PAD_X = 60;   // left/right space so menu/labels stay visible
const EDGE_PAD_TOP = 160;    // extra top space to fit callout/menu above the plant
const EDGE_PAD_BOTTOM = 80;  // a little space under the plant

// Drag hysteresis (px): don’t start moving until finger travels this far
const DRAG_THRESHOLD = 12

export default {
  name: 'Home',
  data() {
    return {
      roomWidth: 0,
      roomHeight: 0,
      actionId: null,      // open menu plant id
      draggingId: null,    // plant id in "move" mode
      isDragging: false,   // pointer is down and moving
      isDragCandidate: false,
      dragStart: { x: 0, y: 0 },   // pointerdown start (px within room)
    }
  },
  computed: {
    ...mapGetters(['allPlants']),
    plants() { return this.allPlants }
  },
  mounted() {
    this.roomHeight = window.innerHeight
    this.$nextTick(() => {
      this.updateRoomSize()
      this.$store.commit('setAllUnwatered')
    })
    window.addEventListener('resize', this.updateRoomSize, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateRoomSize)
  },
  methods: {
    onBgLoad() { this.updateRoomSize() },
    updateRoomSize() {
      const img = this.$refs.bg
      if (!img || !img.naturalWidth || !img.naturalHeight) return
      const targetH = window.innerHeight
      const scale = targetH / img.naturalHeight
      this.roomHeight = targetH
      this.roomWidth = Math.round(img.naturalWidth * scale)

      // pull any edge plants back inside the safe area
      this.$nextTick(() => this.clampAllPlantsToSafeArea())
    },
    waterPlant(id) {
      this.$store.commit('waterPlant', id)
      this.closeActions()
    },

    // Actions
    openActions(id) { if (!this.isDragging) this.actionId = id },
    closeActions() { this.actionId = null; this.draggingId = null },
    deletePlant(id) { this.$store.commit('removePlant', id); this.closeActions() },

    onRoomPointerDown(e) {
  // Tap-to-place: if user already picked "Move" (draggingId set) and taps the room (not a plant),
  // just place the plant there (clamped) without dragging.
  if (!this.draggingId) return
  const target = e.target
  if (target.closest('.plant')) return  // ignore taps on plants; those go through beginDrag
  this.updatePositionFromEvent(e)       // place immediately
  this.draggingId = null                // exit move mode
  },

  enableMove(id) {
    this.draggingId = id
    this.actionId = null
    // User can either drag the plant OR tap anywhere in the room to place it.
  },

  beginDrag(id, e) {
    if (this.draggingId !== id) return
    const room = this.$el.querySelector('.room')
    if (!room) return
    const rect = room.getBoundingClientRect()
    this.isDragCandidate = true
    this.isDragging = false
    this.dragStart.x = e.clientX - rect.left
    this.dragStart.y = e.clientY - rect.top
    e.currentTarget.setPointerCapture?.(e.pointerId)
  },

  onPointerMove(e) {
    if (!this.draggingId) return
    const room = this.$el.querySelector('.room')
    if (!room) return

    const rect = room.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    // If we’re only a candidate, check threshold before starting real drag
    if (this.isDragCandidate && !this.isDragging) {
      const dx = cx - this.dragStart.x
      const dy = cy - this.dragStart.y
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        this.isDragging = true
        this.$el.classList.add('dragging')   // locks scroll via CSS
      } else {
        return
      }
    }

    if (this.isDragging) {
      e.preventDefault() // stop the page from panning while dragging
      this.updatePositionFromCoords(cx, cy, rect)
    }
  },

  onPointerUp() {
    if (!this.draggingId) return
    this.isDragCandidate = false
    if (this.isDragging) {
      // already saved final position on move
      this.isDragging = false
      this.$el.classList.remove('dragging')
    } else {
      // It was a light tap on the plant while in move mode — do nothing special here.
    }
    this.draggingId = null
  },

  updatePositionFromEvent(e) {
    const room = this.$el.querySelector('.room')
    if (!room || !this.draggingId) return
    const rect = room.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    this.updatePositionFromCoords(px, py, rect)
  },

  updatePositionFromCoords(px, py, rect) {
    // Clamp in pixels
    const minX = EDGE_PAD_X
    const maxX = rect.width - EDGE_PAD_X
    const minY = EDGE_PAD_TOP
    const maxY = rect.height - EDGE_PAD_BOTTOM

    const clampedX = Math.max(minX, Math.min(maxX, px))
    const clampedY = Math.max(minY, Math.min(maxY, py))

    // Convert to % and store
    const xPct = Math.round((clampedX / rect.width) * 100)
    const yPct = Math.round((clampedY / rect.height) * 100)

    this.$store.commit('updatePlantPosition', { id: this.draggingId, x: xPct, y: yPct })
  },

  clampAllPlantsToSafeArea() {
    const room = this.$el.querySelector('.room')
    if (!room) return
    const rect = room.getBoundingClientRect()

    const minX = EDGE_PAD_X
    const maxX = rect.width - EDGE_PAD_X
    const minY = EDGE_PAD_TOP
    const maxY = rect.height - EDGE_PAD_BOTTOM

    this.plants.forEach(p => {
      // convert stored % to px
      const px = (p.x / 100) * rect.width
      const py = (p.y / 100) * rect.height

      const clampedX = Math.max(minX, Math.min(maxX, px))
      const clampedY = Math.max(minY, Math.min(maxY, py))

      // back to %
      const xPct = Math.round((clampedX / rect.width) * 100)
      const yPct = Math.round((clampedY / rect.height) * 100)

      if (xPct !== p.x || yPct !== p.y) {
        this.$store.commit('updatePlantPosition', { id: p.id, x: xPct, y: yPct })
      }
    })
  },
  }
}
</script>

<style scoped>
.bg-pan {
  position: fixed; inset: 0; overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-x pan-y;
  background: #f8fafc;
}
.bg-pan.dragging { cursor: grabbing; touch-action: none; }

.room { position: relative; }

.pan-img {
  display: block; height: 100vh; width: auto; max-width: none;
  user-select: none; pointer-events: none;
}

.plant {
  position: absolute;
  transform: translate(-50%, -100%);
  text-decoration: none;
}
.plant.movable { cursor: grab; }
.plant.movable:active { cursor: grabbing; }

.pot {
  width: 140px; height: auto;
  user-select: none; -webkit-user-drag: none;
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.3));
  display: block; transition: transform 0.15s ease;
}
.plant:hover .pot { transform: scale(1.08); }

.label {
  position: absolute;
  top: calc(100% + 8px);     /* sit just below the image */
  left: 50%;
  transform: translateX(-50%);
  margin: 0;                 /* was margin-top; remove it */
  text-align: center;
  font-size: 15px;
  line-height: 1.2;
  color: #0f172a;
  text-shadow: 0 1px 2px rgba(255,255,255,0.7);
}
.label .name { font-weight: 700; font-size: 16px; }
.label .species { opacity: 0.75; font-size: 14px; }

/* Action menu */
.action-menu {
  position: absolute; bottom: 100%; left: 50%;
  transform: translate(-50%, -8px);
  display: flex; gap: 8px; padding: 6px;
  background: rgba(255,255,255,0.9);
  border-radius: 999px; box-shadow: 0 8px 18px rgba(0,0,0,.18);
  backdrop-filter: blur(4px);
}
.action-btn {
  width: 40px; height: 40px; border: none; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer;
  background: #eef6ee; transition: transform .1s ease, background .15s ease;
}
.action-btn:hover { transform: scale(1.06); background: #e6f2e6; }
.action-btn.danger { background: #ffecec; }
.action-btn.danger:hover { background: #ffdede; }

:global(html), :global(body) { height: 100%; overflow: hidden; }

@media (max-width: 640px) {
  .pot { width: 90px; }
  .label .name { font-size: 14px; }
  .label .species { font-size: 13px; }
  .action-btn { width: 36px; height: 36px; font-size: 18px; }
}
.callout {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -6px);
  padding: 6px 10px;
  background: #fff7ed;           /* warm hint background */
  color: #9a3412;                 /* dark amber text */
  border: 1px solid #fdba74;      /* light amber border */
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.1;
  white-space: nowrap;
  box-shadow: 0 6px 14px rgba(0,0,0,.12);
  animation: pulseHint 1.2s ease-in-out 0s 2;
}

.callout::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -2px);
  width: 10px;
  height: 10px;
  background: inherit;
  border-left: inherit;
  border-bottom: inherit;
  transform-origin: center;
  transform: translate(-50%, -2px) rotate(45deg);
  box-shadow: 2px 2px 2px rgba(0,0,0,.04);
}

@keyframes pulseHint {
  0%,100% { transform: translate(-50%, -6px) scale(1); }
  50%     { transform: translate(-50%, -6px) scale(1.05); }
}

</style>
