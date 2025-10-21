<template>
    <div class="wrap">
      <section class="card">
        <h2>Set up your plant</h2>
  
        <!-- Species + care info -->
        <div class="info">
          <div class="species">🌿 {{ draft.species }}</div>
          <div class="care">
            <div>💧 Water: <strong>{{ care.water }}</strong></div>
            <div>☀️ Sun: <strong>{{ care.sun }}</strong></div>
            <div>⭐ Level: <strong>{{ care.level }}</strong></div>
          </div>
        </div>
  
        <!-- Customize: name + image picker -->
        <div class="customize">
          <label class="label">Plant Name</label>
          <div class="name-row">
            <input class="input" v-model="draft.name" placeholder="My plant" />
            <button class="ghost" @click="suggest">Suggest</button>
          </div>
  
          <label class="label">Choose Picture</label>
          <div class="img-picker">
            <button class="nav" @click="prevImage" aria-label="Previous image">‹</button>
            <div class="img-preview">
              <img :src="currentImage" :alt="`${galleryKey} option`" />
            </div>
            <button class="nav" @click="nextImage" aria-label="Next image">›</button>
          </div>
          <small>Browsing <strong>{{ galleryKey }}</strong> gallery ({{ images.length }} options)</small>
        </div>
  
        <div class="actions">
          <button class="btn" @click="save">Save</button>
          <button class="btn btn-grey" @click="cancel">Cancel</button>
        </div>
      </section>
    </div>
  </template>
  
  <script setup>
  import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
  
  const store = useStore()
  const router = useRouter()

  
  // ----- Galleries (paths relative to /public) -----
  const GALLERY = {
    orchid:   ['/orchids/orchids-1.png','/orchids/orchids-2.png','/orchids/orchids-3.png','/orchids/orchids-4.png'],
    monstera: ['/monstera/monstera-1.png','/monstera/monstera-2.png','/monstera/monstera-3.png','/monstera/monstera-4.png'],
    ficus:    ['/ficus/ficus-1.png','/ficus/ficus-2.png','/ficus/ficus-3.png','/ficus/ficus-4.png'],
    pothos:   ['/pothos/pothos-1.png','/pothos/pothos-2.png','/pothos/pothos-3.png','/pothos/pothos-4.webp'],
    unknown:  ['/unknown/unknown-1.png','/unknown/unknown-2.png', '/unknown/unknown-3.png', '/unknown/unknown-4.png']
  }
  
  // Mock care info by species (display names)
  const SPECIES_INFO = {
    Orchid:   { water: 'low',      sun: 'bright-indirect', level: 'medium' },
    Monstera: { water: 'moderate', sun: 'bright-indirect', level: 'easy'   },
    Pothos:   { water: 'low',      sun: 'low–medium',      level: 'easy'   },
    Ficus:    { water: 'moderate', sun: 'bright',          level: 'medium' },
    Unknown:  { water: 'moderate', sun: 'medium',          level: 'medium' }
  }
  
  const temp = computed(() => store.getters?.tempPlant ?? store.state?.tempPlant)
  
  const draft = reactive({
    species: '',
    name: '',
    imageIndex: 0
  })
  
  // Normalize species to gallery key
  function toKey(species) {
    if (!species) return 'unknown'
    const s = species.toLowerCase().replace(/\s+/g, '')
    if (s.startsWith('orchid')) return 'orchid'
    if (s.startsWith('monstera')) return 'monstera'
    if (s.startsWith('ficus')) return 'ficus'
    if (s.startsWith('pothos')) return 'pothos'
    return 'unknown'
  }
  
  const galleryKey = computed(() => toKey(draft.species))
  const images = computed(() => GALLERY[galleryKey.value] || GALLERY.unknown)
  const currentImage = computed(() => images.value[draft.imageIndex % images.value.length])
  
  const care = computed(() => {
    // Map galleryKey back to display species name for care table
    const display = {
      orchid: 'Orchid',
      monstera: 'Monstera',
      ficus: 'Ficus',
      pothos: 'Pothos',
      unknown: 'Unknown'
    }[galleryKey.value]
    return SPECIES_INFO[display] || SPECIES_INFO.Unknown
  })
  
  onMounted(() => {
    if (!temp.value) {
      router.replace('/')
      return
    }
    draft.species = temp.value.species || 'Unknown'
    draft.name = temp.value.name || draft.species
    draft.imageIndex = Number.isInteger(temp.value.imageIndex) ? temp.value.imageIndex : 0
  })
  
  function prevImage() {
    const n = images.value.length
    draft.imageIndex = (draft.imageIndex + n - 1) % n
  }
  function nextImage() {
    const n = images.value.length
    draft.imageIndex = (draft.imageIndex + 1) % n
  }
  function suggest() {
    const pool = ['Leafy','Sunny','Sprout','Pebble','Fernie','Willow','Ivy']
    draft.name = pool[Math.floor(Math.random() * pool.length)]
  }
  function cancel() {
    store.commit?.('clearTempPlant')
    router.push('/')
  }
  function save() {
    const plant = {
      id: Date.now().toString(),
      species: draft.species,
      name: (draft.name || draft.species).trim(),
      image: currentImage.value,   // <-- chosen picture used in Home
      // spawn position in room as % so it scales
      x: Math.round(10 + Math.random() * 80),
      y: Math.round(10 + Math.random() * 70),
      watered: false
    }
    store.commit('addPlant', plant)
    store.commit('clearTempPlant')
    router.push('/')
  }
  </script>
  
  <style scoped>
  .wrap { display: grid; gap: 24px; padding: 16px; max-width: 980px; margin: 0 auto; }
  .card { background:#fff; border-radius:16px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.08); }
  .sub { color:#6aa56b; margin:.25rem 0 1rem; }
  .info { display:grid; gap:8px; margin-bottom: 12px; }
  .species { font-size: 1.2rem; font-weight: 700; }
  .care { display:flex; gap:16px; flex-wrap: wrap; }
  
  .customize { display:grid; gap: 12px; margin-top: 8px; }
  .label { font-weight: 600; }
  .name-row { display:flex; gap:8px; align-items:center; }
  .input { flex:1; padding:10px 12px; border:2px solid #9dcf9f; border-radius:12px; }
  
  .img-picker { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; margin-top: 6px; }
  .img-preview { display:grid; place-items:center; height:220px; }
  .img-preview img { height: 200px; width: auto; object-fit: contain; }
  
  .nav {
    display:flex; align-items:center; justify-content:center;
    width:48px; height:48px; border-radius:50%;
    border:none; background:#efefef; color:#333;
    font-size:1.5rem; line-height:1;
    cursor:pointer; transition: background .15s ease, transform .1s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,.08);
  }
  .nav:hover { background:#e5e5e5; transform: scale(1.05); }
  .nav:active { transform: scale(0.95); }
  
  .actions { display:flex; gap:10px; margin-top: 12px; }
  .btn { padding:10px 16px; border-radius:24px; border:0; background:#69b36b; color:#fff; font-weight:600; cursor:pointer; }
  .btn-grey { background:#9ca3af; }
  .ghost { border:1px solid #cfd; background:#f9fff9; color:#2b6; padding:8px 12px; border-radius:18px; }
  </style>
  