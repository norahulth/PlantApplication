import { createStore } from 'vuex'

const load = k => JSON.parse(localStorage.getItem(k) || 'null')
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export default createStore({
  state: () => ({
    plants: load('plants') || [],
    tempPlant: load('tempPlant') || null, // holds camera/scan result
  }),
  getters: {
    allPlants: s => s.plants,
    tempPlant: s => s.tempPlant,
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
    updatePlant(state, updated) {
      const i = state.plants.findIndex(p => p.id === updated.id)
      if (i !== -1) state.plants[i] = updated
      save('plants', state.plants)
    }
  }
})
