import { createStore } from 'vuex'

const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export default createStore({
  state: () => ({
    plants: load('plants', []),
    tempPlant: load('tempPlant', null)
  }),
  getters: {
    allPlants: s => s.plants,
    tempPlant: s => s.tempPlant
  },
  mutations: {
    setTempPlant(state, payload) {
      state.tempPlant = payload
      save('tempPlant', payload)
    },
    clearTempPlant(state) {
      state.tempPlant = null
      save('tempPlant', null)
    },
    addPlant(state, plant) {
      state.plants.push(plant)
      save('plants', state.plants)
    },
    removePlant(state, id) {
      state.plants = state.plants.filter(p => p.id !== id)
      localStorage.setItem('plants', JSON.stringify(state.plants))
    },
    updatePlantPosition(state, { id, x, y }) {
      const i = state.plants.findIndex(p => p.id === id)
      if (i !== -1) {
        state.plants[i] = { ...state.plants[i], x, y }
        localStorage.setItem('plants', JSON.stringify(state.plants))
      }
    },
    setAllUnwatered(state) {
      state.plants = state.plants.map(p => ({ ...p, watered: false }))
      localStorage.setItem('plants', JSON.stringify(state.plants))
    },
    waterPlant(state, id) {
      const i = state.plants.findIndex(p => p.id === id)
      if (i !== -1) {
        state.plants[i] = { ...state.plants[i], watered: true }
        localStorage.setItem('plants', JSON.stringify(state.plants))
      }
    },
  }
})
