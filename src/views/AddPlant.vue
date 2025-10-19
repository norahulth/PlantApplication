<template>
  <div class="add-plant-page">
    
    <h1 class="title">ADD PLANT</h1>

    <!-- MODE PICKER -->
    <div v-if="mode === 'none'" class="mode-picker">
      <button class="btn big" @click="pickMode('camera')">ADD WITH CAMERA</button>
      <button class="btn big btn-secondary" @click="pickMode('manual')">ADD MANUALLY</button>
    </div>

    <!-- FILE-CHOICE CAMERA MODE -->
    <div v-if="mode === 'camera'" class="camera-section">
      <div class="section-header">
        <button class="back-circle" @click="resetMode" aria-label="Go back">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h2>Add a photo</h2>
      </div>

      <!-- Two big options: Take photo or Choose from library -->
      <div v-if="!photoData" class="upload-wrap">
        <!-- Hidden inputs -->
        <input
          id="takeInput"
          ref="takeInput"
          type="file"
          accept="image/*"
          capture="environment"
          @change="onFile"
          hidden
        />
        <input
          id="pickInput"
          ref="pickInput"
          type="file"
          accept="image/*"
          @change="onFile"
          hidden
        />

        <!-- Buttons -->
        <div class="choice-buttons">
          <label for="takeInput" class="btn big btn-accent">TAKE PHOTO</label>
          <label for="pickInput" class="btn big btn-secondary">UPLOAD PHOTO</label>
        </div>
      </div>

      <!-- Preview after selecting a file -->
      <div v-if="photoData" class="photo-wrap">
        <img :src="photoData" alt="Selected plant photo" />
        <div class="controls">
          <button class="btn" @click="savePhoto">SAVE</button>
          <button class="btn btn-secondary" @click="retake">RETAKE</button>
        </div>
      </div>
    </div>

    <!-- MANUAL MODE -->
    <div v-if="mode === 'manual'" class="manual-section">
      <div class="section-header">
        <button class="back-circle" @click="resetMode" aria-label="Go back">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
             <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h2>Add manually</h2>
      </div>

      <form @submit.prevent="saveManual" class="manual-form">
        <label for="plantName">PLANT NAME</label>
        <input
          id="plantName"
          v-model.trim="manualName"
          type="text"
          placeholder="e.g. Orchids"
          required
        />
        <div class="controls">
          <button class="btn" type="submit">SAVE</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "AddPlant",
  data() {
    return {
      mode: "none",       // 'none' | 'camera' | 'manual'
      photoData: null,    // data URL of selected image
      manualName: "",     // manual entry
    };
  },
  methods: {
    // Mode handling
    pickMode(next) {
      this.mode = next;
      if (next === "camera") this.photoData = null;
      if (next === "manual") this.manualName = "";
    },
    resetMode() {
      this.photoData = null;
      this.manualName = "";
      this.mode = "none";
    },

    // Manual flow
    saveManual() {
      const name = this.manualName.trim();
      if (!name) return;
      // TODO: replace with your own save logic
      alert(`Saved plant: ${name}`);
      this.resetMode();
    },

    // File flow (camera/library)
    onFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoData = reader.result;
      };
      reader.readAsDataURL(file);
    },
    retake() {
      this.photoData = null;
      // Optional: immediately re-open the last used picker
      // this.$refs.takeInput?.click(); or this.$refs.pickInput?.click();
    },
    savePhoto() {
      // TODO: replace with your own save logic (API/store/etc.)
      const a = document.createElement("a");
      a.href = this.photoData;
      a.download = "plant.jpg";
      a.click();
      this.resetMode();
    },
  },
};
</script>

<style scoped>
/* Center initial screen (title + buttons) */
.add-plant-page {
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  color: #1f2937;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  margin: 0 0 24px;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
}

/* Buttons stacked, centered */
.mode-picker {
  display: flex;
  flex-direction: column; /* camera above manual */
  gap: 14px;
  width: 100%;
  max-width: 320px;
  align-items: stretch;
}

/* Sections centered */
.camera-section, .manual-section {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header: title centered, back pinned left */
.section-header {
  position: relative;
  width: 100%;
  max-width: 720px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0 20px;
  padding-top: 56px; /* space for the floating back button above the title */
}
.section-header h2 { margin: 0; font-size: 1.2rem; text-align: center; }
.section-header .back {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
}

/* Two big choice buttons */
.choice-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  align-items: stretch;
  justify-content: center;
}
.upload-wrap { display: grid; gap: 10px; justify-items: center; }
.hint { font-size: 0.9rem; color: #6b7280; text-align: center; }

/* Preview image */
.photo-wrap { display: grid; gap: 12px; justify-items: center; }
.photo-wrap img { width: min(100%, 480px); border-radius: 12px; }

/* Controls + Buttons */
.controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

.btn {
  border: none;
  padding: 12px 16px;
  border-radius: 12px;
  background: #4caf50; /* default green */
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.btn.big { font-size: 1rem; }
.btn-secondary { background: #3b82f6; } /* blue */
.btn-accent { background: #22c55e; }    /* brighter green */

.link { background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; font-size: .95rem; }
.link:hover { text-decoration: underline; }

/* Manual form centering */
.manual-form {
  width: 100%;
  max-width: 420px;
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
}
.manual-form label { width: 100%; font-weight: 600; }
.manual-form input {
  width: 100%;
  max-width: 420px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  margin: 0 auto;
}

/* Circular back button in the upper-left corner */
.back-circle {
  position: absolute;
  top: 8px;
  left: 8px;

  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: #9ca3af; /* gray */
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  box-shadow: 0 2px 6px rgba(0,0,0,.12);
  transition: transform .08s ease, background .15s ease;
}
.back-circle:hover { background: #6b7280; }    /* darker gray */
.back-circle:active { transform: scale(.96); } /* tap feedback */
.back-circle:focus-visible {
  outline: 3px solid #bfdbfe;
  outline-offset: 2px;
}

/* Grey variant */
.btn-grey {
  background: #9ca3af;          /* gray-400 */
  color: #fff;
}
.btn-grey:hover { background: #6b7280; }   /* gray-500 */
.btn-grey:active { transform: translateY(-50%) scale(0.98); }

</style>
