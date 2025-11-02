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
        :class="{ movable: true }"
        :style="{ left: p.x + '%', top: p.y + '%' }"
        :title="`${p.name} (${p.species})`"
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
          <button class="action-btn danger" @click="deletePlant(p.id)" title="Delete">✖️</button>
        </div>

        <!-- Watering animation -->
        <div v-if="wateringPlantId === p.id" class="watering-animation">
          <img 
            :src="wateringFrame === 1 ? '/watering-can-full.png' : '/watering-can-empty.png'"
            alt="Watering can"
            class="watering-can"
          />
        </div>
      </div>

      <!-- Thought Bubble over sofa -->
      <div 
        class="thought-bubble" 
        :class="{ expanded: bubbleExpanded }"
        @click.stop="toggleBubble"
      >
        <div v-if="bubbleExpanded" class="bubble-text">
          Would you like to customize your couch? Updates are coming soon...
        </div>
        <div v-else class="bubble-dots">
          <span></span>
          <span></span>
          <span></span>
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
      bubbleExpanded: false, // thought bubble state
      longPressTimer: null, // timer for long-press detection
      isLongPress: false,   // whether long press was triggered
      wateringPlantId: null, // plant being watered (for animation)
      wateringFrame: 0,      // animation frame (0=empty, 1=full, 2=empty)
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
      this.$store.dispatch('setAllUnwatered')
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
    async waterPlant(id) {
      // Start watering animation
      this.wateringPlantId = id
      this.wateringFrame = 0
      
      // Animate: empty -> full -> empty
      setTimeout(() => { this.wateringFrame = 1 }, 200)   // Show full can after 200ms
      setTimeout(() => { this.wateringFrame = 2 }, 600)   // Show empty can again after 600ms
      setTimeout(() => { this.wateringPlantId = null }, 1000)  // Hide after 1s
      
      // Actually water the plant
      await this.$store.dispatch('waterPlant', id)
      this.closeActions()
    },

    // Actions
    openActions(id) { 
      if (!this.isDragging) {
        this.actionId = id
      }
    },
    closeActions() { 
      this.actionId = null
      this.draggingId = null
      this.bubbleExpanded = false // Close bubble when clicking elsewhere
    },
    toggleBubble() {
      this.bubbleExpanded = !this.bubbleExpanded
    },
    async deletePlant(id) { 
      await this.$store.dispatch('removePlant', id)
      this.closeActions()
    },

    onRoomPointerDown(e) {
      // Just close menus when clicking on room background
      // (Plants handle their own drag logic)
    },

    beginDrag(id, e) {
      // Clear any existing timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
      }
      
      // Store the plant we're potentially dragging
      this.draggingId = id
      this.isLongPress = false
      this.isDragging = false
      this.isDragCandidate = false
      
      const room = this.$el.querySelector('.room')
      if (!room) return
      const rect = room.getBoundingClientRect()
      this.dragStart.x = e.clientX - rect.left
      this.dragStart.y = e.clientY - rect.top
      
      // Set up long-press detection (500ms)
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true
        this.isDragCandidate = true
        // Provide haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 500)
      
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },

  onPointerMove(e) {
    if (!this.draggingId) return
    
    // If long press hasn't been triggered yet, cancel it if user moves too much
    if (!this.isLongPress && this.longPressTimer) {
      const room = this.$el.querySelector('.room')
      if (!room) return
      const rect = room.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const dx = cx - this.dragStart.x
      const dy = cy - this.dragStart.y
      
      // If moved beyond threshold before long press, cancel the long press
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
        return
      }
    }
    
    // Only allow dragging if long press was triggered
    if (!this.isLongPress) return
    
    const room = this.$el.querySelector('.room')
    if (!room) return
    const rect = room.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    // Start dragging on first movement after long press
    if (this.isDragCandidate && !this.isDragging) {
      const dx = cx - this.dragStart.x
      const dy = cy - this.dragStart.y
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        this.isDragging = true
        this.$el.classList.add('dragging')
      } else {
        return
      }
    }

    if (this.isDragging) {
      e.preventDefault()
      this.updatePositionFromCoords(cx, cy, rect)
    }
  },

  onPointerUp() {
    // Clear long press timer if still running
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    if (!this.draggingId) return
    
    const plantId = this.draggingId
    this.isDragCandidate = false
    
    if (this.isDragging) {
      // User dragged the plant - position already saved
      this.isDragging = false
      this.$el.classList.remove('dragging')
    } else if (!this.isLongPress) {
      // It was a quick tap (no long press, no drag) - open the action menu
      this.openActions(plantId)
    }
    // If it was a long press but no drag, do nothing
    
    this.draggingId = null
    this.isLongPress = false
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

    this.$store.dispatch('updatePlantPosition', { id: this.draggingId, x: xPct, y: yPct })
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
        this.$store.dispatch('updatePlantPosition', { id: p.id, x: xPct, y: yPct })
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
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none; /* Prevent iOS context menu */
  touch-action: none; /* Prevent default touch behaviors */
}

.pot {
  width: 140px; height: auto;
  user-select: none; 
  -webkit-user-drag: none;
  -webkit-touch-callout: none; /* Prevent iOS callout */
  pointer-events: none; /* Let parent handle all interactions */
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

/* Watering animation */
.watering-animation {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -20px);
  pointer-events: none;
  z-index: 200;
  animation: wateringDrop 1s ease-out;
}

.watering-can {
  width: 80px;
  height: auto;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  animation: wateringTilt 0.8s ease-in-out;
}

@keyframes wateringDrop {
  0% { 
    opacity: 0; 
    transform: translate(-50%, -60px) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -30px) scale(1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -20px) scale(1);
  }
  100% { 
    opacity: 0; 
    transform: translate(-50%, -10px) scale(0.9);
  }
}

@keyframes wateringTilt {
  0%, 100% { transform: rotate(0deg); }
  30%, 70% { transform: rotate(-15deg); }
}

@media (max-width: 640px) {
  .pot { width: 90px; }
  .label .name { font-size: 14px; }
  .label .species { font-size: 13px; }
  .action-btn { width: 36px; height: 36px; font-size: 18px; }
  
  .watering-can { width: 60px; }
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

/* Thought Bubble over sofa */
.thought-bubble {
  position: absolute;
  top: 38%;
  left: 38%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Small bubble with dots */
.thought-bubble:not(.expanded) {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

.thought-bubble:not(.expanded):hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* Small circles below the main bubble */
.thought-bubble:not(.expanded)::before,
.thought-bubble:not(.expanded)::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.thought-bubble:not(.expanded)::before {
  width: 20px;
  height: 20px;
  bottom: -25px;
  left: 10px;
}

.thought-bubble:not(.expanded)::after {
  width: 12px;
  height: 12px;
  bottom: -40px;
  left: 5px;
}

/* Three dots inside small bubble */
.bubble-dots {
  display: flex;
  gap: 6px;
}

.bubble-dots span {
  width: 8px;
  height: 8px;
  background: #69b36b;
  border-radius: 50%;
}

/* Expanded bubble with text */
.thought-bubble.expanded {
  width: 280px;
  padding: 16px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  transform: translateX(-50%) scale(1);
}

.thought-bubble.expanded::before,
.thought-bubble.expanded::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.thought-bubble.expanded::before {
  width: 24px;
  height: 24px;
  bottom: -28px;
  left: 30px;
}

.thought-bubble.expanded::after {
  width: 14px;
  height: 14px;
  bottom: -42px;
  left: 20px;
}

.bubble-text {
  font-size: 15px;
  line-height: 1.5;
  color: #1f2937;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 640px) {
  .thought-bubble:not(.expanded) {
    width: 50px;
    height: 50px;
  }
  
  .thought-bubble.expanded {
    width: 240px;
    padding: 14px 16px;
  }
  
  .bubble-text {
    font-size: 14px;
  }
}

</style>
