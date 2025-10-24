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
    <h2>Add a photo</h2>
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
        <h2>Add manually</h2>
      </div>

      <form @submit.prevent="saveManual" class="manual-form">
        <label for="plantSpecies">SPECIES</label>
        <input
          id="plantSpecies"
          v-model.trim="manualSpecies"
          type="text"
          placeholder="e.g. Monstera, Pothos, Ficus"
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

      // 1. Read file as base64 data URL (you already had this)
      const reader = new FileReader();
      reader.onload = async () => {
        this.photoData = reader.result; // "data:image/jpeg;base64,...."
        // 2. Immediately ask backend to classify
        this.isLoading = true;
        this.guess = null;

        console.log("[AddPlant] photoData starts with:", this.photoData?.slice(0, 50));

        try {
          const res = await fetch("/api/classifyPlant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageDataUrl: this.photoData,
            }),
          });

          console.log("[AddPlant] status from /api/classifyPlant:", res.status);

          const json = await res.json();
          console.log("[AddPlant] response json:", json);

          this.guess = json.species || "unknown";
        } catch (err) {
          console.error("classification failed", err);
          this.guess = "unknown";
        } finally {
          this.isLoading = false;
        }
      };
      reader.readAsDataURL(file);
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
/* (same styles you had) */
.add-plant-page { min-height: 100vh; padding: 16px; box-sizing: border-box; color: #1f2937; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.title { margin: 0 0 24px; font-size: 1.8rem; font-weight: 700; text-align: center; }
.mode-picker { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 320px; align-items: stretch; }
.camera-section, .manual-section { width: 100%; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
.section-header { position: relative; width: 100%; max-width: 720px; display: flex; justify-content: center; align-items: center; margin: 12px 0 20px; padding-top: 56px; }
.section-header h2 { margin: 0; font-size: 1.2rem; text-align: center; }
.choice-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; align-items: stretch; justify-content: center; }
.upload-wrap { display: grid; gap: 10px; justify-items: center; }
.photo-wrap { display: grid; gap: 12px; justify-items: center; }
.photo-wrap img { width: min(100%, 480px); border-radius: 12px; }
.controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.btn { border: none; padding: 12px 16px; border-radius: 12px; background: #4caf50; color: #fff; font-weight: 600; cursor: pointer; }
.btn.big { font-size: 1rem; }
.btn-secondary { background: #3b82f6; }
.btn-accent { background: #22c55e; }
.manual-form { width: 100%; max-width: 420px; display: grid; gap: 12px; justify-items: center; text-align: center; }
.manual-form label { width: 100%; font-weight: 600; }
.manual-form input { width: 100%; max-width: 420px; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 1rem; }
.back-circle { position: absolute; top: 8px; left: 8px; width: 40px; height: 40px; border-radius: 999px; border: none; background: #9ca3af; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.12); transition: transform .08s ease, background .15s ease; }
.back-circle:hover { background: #6b7280; } .back-circle:active { transform: scale(.96); }
.ai-result {
  font-size: 0.95rem;
  background: #f3f4f6;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: center;
  max-width: 320px;
}
.ai-result p {
  margin: 0;
  font-weight: 500;
  color: #1f2937;
}
.ai-result strong {
  font-weight: 700;
  color: #111827;
}

</style>
