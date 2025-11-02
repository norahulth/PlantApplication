import { createStore } from 'vuex'

// Generate or retrieve a unique user ID for this device
const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('userId', userId)
  }
  return userId
}

const userId = getUserId()

// Helper to call API
const apiCall = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
  }
  if (body) options.body = JSON.stringify(body)
  
  const res = await fetch(endpoint, options)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Keep temp data in localStorage (doesn't need to sync)
const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export default createStore({
  state: () => ({
    plants: [],
    tempPlant: load('tempPlant', null),
    loading: false,
    error: null,
  }),
  getters: {
    allPlants: s => s.plants,
    tempPlant: s => s.tempPlant,
  },
  mutations: {
    setPlants(state, plants) {
      state.plants = plants
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    setTempPlant(state, payload) {
      state.tempPlant = payload
      save('tempPlant', payload)
    },
    clearTempPlant(state) {
      state.tempPlant = null
      save('tempPlant', null)
    },
  },
  actions: {
    // Load plants from Upstash
    async loadPlants({ commit }) {
      try {
        commit('setLoading', true)
        commit('setError', null)
        const data = await apiCall('GET', `/api/plants?userId=${userId}`)
        commit('setPlants', data.plants || [])
      } catch (error) {
        console.error('Failed to load plants:', error)
        commit('setError', error.message)
        // Fallback to localStorage if API fails
        const localPlants = load('plants', [])
        commit('setPlants', localPlants)
      } finally {
        commit('setLoading', false)
      }
    },

    // Save plants to Upstash
    async savePlants({ state }) {
      try {
        await apiCall('POST', '/api/plants', { plants: state.plants })
      } catch (error) {
        console.error('Failed to save plants:', error)
        // Fallback: save to localStorage
        save('plants', state.plants)
      }
    },

    async addPlant({ state, commit, dispatch }, plant) {
      const updated = [...state.plants, plant]
      commit('setPlants', updated)
      await dispatch('savePlants')
    },

    async removePlant({ state, commit, dispatch }, id) {
      const updated = state.plants.filter(p => p.id !== id)
      commit('setPlants', updated)
      await dispatch('savePlants')
    },

    async updatePlantPosition({ state, commit, dispatch }, { id, x, y }) {
      const i = state.plants.findIndex(p => p.id === id)
      if (i !== -1) {
        const updated = [...state.plants]
        updated[i] = { ...updated[i], x, y }
        commit('setPlants', updated)
        await dispatch('savePlants')
      }
    },

    async setAllUnwatered({ state, commit, dispatch }) {
      const updated = state.plants.map(p => ({ ...p, watered: false }))
      commit('setPlants', updated)
      await dispatch('savePlants')
    },

    async waterPlant({ state, commit, dispatch }, id) {
      const i = state.plants.findIndex(p => p.id === id)
      if (i !== -1) {
        const updated = [...state.plants]
        updated[i] = { ...updated[i], watered: true }
        commit('setPlants', updated)
        await dispatch('savePlants')
      }
    },
  },
})