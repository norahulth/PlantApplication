<template>
  <div class="add-plant-page">
    <h1 class="title">ADD PLANT</h1>

    <!-- MODE PICKER -->
    <div v-if="mode === 'none'" class="mode-picker">
      <button class="btn big" @click="pickMode('camera')">ADD WITH CAMERA</button>
      <button class="btn big btn-secondary" @click="pickMode('manual')">ADD MANUALLY</button>
    </div>

    <!-- CAMERA MODE -->
<div v-if="mode === 'camera'" class="camera-section">
  <div class="section-header">
    <button class="back-circle" @click="resetMode" aria-label="Go back">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Before photo is picked -->
  <div v-if="!photoData" class="upload-wrap">
    <input id="takeInput" ref="takeInput" type="file" accept="image/*" capture="environment" @change="onFile" hidden />
    <input id="pickInput" ref="pickInput" type="file" accept="image/*" @change="onFile" hidden />
    <div class="choice-buttons">
      <label for="takeInput" class="btn big btn-accent">TAKE PHOTO</label>
      <label for="pickInput" class="btn big btn-secondary">UPLOAD PHOTO</label>
    </div>
  </div>

  <!-- After photo is picked -->
  <div v-else class="photo-wrap">
    <img :src="photoData" alt="Selected plant photo" />

    <div class="ai-result" v-if="isLoading">
      <p>Identifying plant...</p>
    </div>

    <div class="ai-result" v-else>
      <p v-if="guess">
        I think this is:
        <strong>{{ guess }}</strong>
      </p>
      <p v-else>
        Couldn't identify this plant (unknown).
      </p>
    </div>

    <div class="controls">
      <button class="btn" :disabled="isLoading" @click="savePhoto">
        ACCEPT &amp; SAVE
      </button>
      <button class="btn btn-secondary" :disabled="isLoading" @click="retake">
        RETAKE
      </button>
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
      </div>

      <form @submit.prevent="saveManual" class="manual-form">
        <label for="plantSpecies">SPECIES</label>
        <input
          id="plantSpecies"
          v-model.trim="manualSpecies"
          type="text"
          placeholder="e.g. Monstera, Peace Lily, Parlor Palm"
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
      mode: "none",        // 'none' | 'camera' | 'manual'
      photoData: null,     // data URL of selected image
      manualSpecies: "",   // manual species entry
      isLoading: false,    // talking to OpenAI?
      guess: null,         // AI guess e.g. 'Monstera deliciosa' or 'unknown'
    };
  },
  methods: {
    // Mode handling
    pickMode(next) {
      this.mode = next;
      if (next === "camera") {
        this.photoData = null;
        this.guess = null;
        this.isLoading = false;
      }
      if (next === "manual") {
        this.manualSpecies = "";
      }
    },
    resetMode() {
      this.photoData = null;
      this.manualSpecies = "";
      this.guess = null;
      this.isLoading = false;
      this.mode = "none";
    },

    async resizeImageFile(file, maxSize = 1024, quality = 0.8) {
  // returns a data URL "data:image/jpeg;base64,..."
  // scaled so that max(width, height) <= maxSize

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const origW = img.width;
        const origH = img.height;

        let targetW = origW;
        let targetH = origH;

        const longestSide = Math.max(origW, origH);
        if (longestSide > maxSize) {
          const scale = maxSize / longestSide;
          targetW = Math.round(origW * scale);
          targetH = Math.round(origH * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const dataUrl = canvas.toDataURL("image/jpeg", quality); // compress
        resolve(dataUrl);
      };

      img.onerror = (err) => reject(err);

      img.src = reader.result; // this is the original big dataURL
    };

    reader.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
},


    // ----- Manual flow: species comes from the input -----
    saveManual() {
      const species = this.manualSpecies.trim();
      if (!species) return;

      this.$store.commit('setTempPlant', {
        source: 'manual',
        species,            // species the user typed
        name: species,      // default name (editable in Setup)
        imageIndex: 0       // user picks actual picture in Setup
      });

      this.$router.push('/setupplant');
    },

    // ----- Camera flow -----
    async onFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  this.isLoading = true;
  this.guess = null;

  try {
    // shrink first
    const resizedDataUrl = await this.resizeImageFile(file, 1024, 0.8);

    // show preview in UI
    this.photoData = resizedDataUrl;

    console.log("[AddPlant] resizedDataUrl starts with:", resizedDataUrl.slice(0, 50));

    const res = await fetch("/api/classifyPlant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: resizedDataUrl,
      }),
    });

    console.log("[AddPlant] status from /api/classifyPlant:", res.status);

    // if it's not 200, grab text so we can see the error HTML / message
    if (!res.ok) {
      const txt = await res.text();
      console.error("[AddPlant] non-200 body:", txt);
      this.guess = "unknown";
      return;
    }

    const json = await res.json();
    console.log("[AddPlant] response json:", json);

    this.guess = json.species || "unknown";
  } catch (err) {
    console.error("classification failed", err);
    this.photoData = null;
    this.guess = "unknown";
  } finally {
    this.isLoading = false;
  }
},


    retake() {
      this.photoData = null;
      this.guess = null;
      this.isLoading = false;
    },

    savePhoto() {
      if (!this.photoData) return;

      // species is either model guess or 'unknown'
      const speciesFinal = this.guess || "unknown";

      this.$store.commit('setTempPlant', {
        source: 'camera',
        species: speciesFinal,
        name: speciesFinal,   // default; user can edit in Setup
        imageIndex: 0,
        // photo: this.photoData,  // you can store this if SetupPlant.vue wants it
      });

      this.$router.push('/setupplant');
    },
  },
};
</script>

<style scoped>
/* Green background with gradient */
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
.title { margin: 0 0 24px; font-size: 1.8rem; font-weight: 700; text-align: center; color: #064e3b; }
.mode-picker { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 320px; align-items: stretch; }
.camera-section, .manual-section { width: 100%; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
.section-header { position: relative; width: 100%; max-width: 720px; display: flex; justify-content: center; align-items: center; margin: 12px 0 20px; padding-top: 56px; }
.section-header h2 { margin: 0; font-size: 1.2rem; text-align: center; color: #064e3b; }
.choice-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; align-items: stretch; justify-content: center; }
.upload-wrap { display: grid; gap: 10px; justify-items: center; }
.photo-wrap { display: grid; gap: 12px; justify-items: center; }
.photo-wrap img { 
  max-width: min(100%, 480px); 
  max-height: 25vh; 
  width: auto; 
  height: auto; 
  object-fit: contain; 
  border-radius: 12px; 
  display: block;
}
.controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
/* Light grey button colors */
.btn { 
  border: none; 
  padding: 12px 16px; 
  border-radius: 12px; 
  background: #d1d5db; 
  color: #1f2937; 
  font-weight: 600; 
  cursor: pointer; 
  transition: transform 0.1s ease, background 0.15s ease;
}
.btn:hover:not(:disabled) {
  background: #9ca3af;
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.big { font-size: 1rem; }
.btn-secondary { 
  background: #d1d5db; 
}
.btn-secondary:hover:not(:disabled) {
  background: #9ca3af;
}
.btn-accent { 
  background: #d1d5db; 
}
.btn-accent:hover:not(:disabled) {
  background: #9ca3af;
}
.manual-form { width: 100%; max-width: 420px; display: grid; gap: 12px; justify-items: center; text-align: center; }
.manual-form label { width: 100%; font-weight: 600; color: #064e3b; }
.manual-form input { 
  width: 100%; 
  max-width: 420px; 
  padding: 10px 12px; 
  border: 2px solid #10b981; 
  border-radius: 10px; 
  font-size: 1rem; 
  background: #fff;
}
.manual-form input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
.back-circle { 
  position: absolute; 
  top: 8px; 
  left: 8px; 
  width: 40px; 
  height: 40px; 
  border-radius: 999px; 
  border: none; 
  background: rgba(255, 255, 255, 0.9); 
  color: #064e3b; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  box-shadow: 0 2px 8px rgba(0,0,0,.15); 
  transition: transform .08s ease, background .15s ease; 
}
.back-circle:hover { background: #fff; } 
.back-circle:active { transform: scale(.96); }
.ai-result {
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 14px;
  border-radius: 8px;
  text-align: center;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}
.ai-result p {
  margin: 0;
  font-weight: 500;
  color: #1f2937;
}
.ai-result strong {
  font-weight: 700;
  color: #064e3b;
}

</style>
