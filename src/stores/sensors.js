import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useSensorsStore = defineStore('sensors', () => {
  const temperature   = ref({ value: null, status: 'ok' })
  const humidity      = ref({ value: null, status: 'ok' })
  const water_level   = ref({ value: null, status: 'ok' })
  const battery_level = ref({ value: null, status: 'ok' })
  const loading       = ref(true)
  const error         = ref(null)   // null | { message, status, retryExhausted }
  const retrying      = ref(false)

  async function fetchInitial() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getInitialData()
      const s = data.sensors
      temperature.value   = s.temperature
      humidity.value      = s.humidity
      water_level.value   = s.water_level
      battery_level.value = s.battery_level
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar sensores',
        status:         err.status  || null,
        retryExhausted: err.retryExhausted || false
      }
    } finally {
      loading.value  = false
      retrying.value = false
    }
  }

  // Manual retry triggered by the user
  async function retry() {
    retrying.value = true
    await fetchInitial()
  }

  function updateFromWebSocket(data) {
    // Normalize flat number format {temperature:20} or object format {temperature:{value:20,status:'ok'}}
    function norm(current, raw) {
      if (raw == null) return current
      if (typeof raw === 'object') return { ...current, ...raw }
      return { ...current, value: raw }
    }
    if (data.temperature   != null) temperature.value   = norm(temperature.value,   data.temperature)
    if (data.humidity      != null) humidity.value      = norm(humidity.value,      data.humidity)
    if (data.water_level   != null) water_level.value   = norm(water_level.value,   data.water_level)
    if (data.battery_level != null) battery_level.value = norm(battery_level.value, data.battery_level)
    error.value = null
  }

  return { temperature, humidity, water_level, battery_level, loading, error, retrying, fetchInitial, retry, updateFromWebSocket }
})
