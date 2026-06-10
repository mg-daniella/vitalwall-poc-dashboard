import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useSystemHealthStore = defineStore('systemHealth', () => {
  const sensors  = ref({ status: 'ok', last_seen: null })
  const apis     = ref({
    open_meteo: { status: 'ok', last_updated: null },
    nasa_power: { status: 'ok', last_updated: null },
    redata:     { status: 'ok', last_updated: null },
    effis:      { status: 'ok', last_updated: null },
    aemet:      { status: 'ok', last_updated: null }
  })
  const loading  = ref(true)
  const error    = ref(null)
  const retrying = ref(false)

  async function fetchHealth() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getSystemHealth()
      sensors.value = data.sensors
      apis.value    = data.apis
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar estado del sistema',
        status:         err.status  || null,
        retryExhausted: err.retryExhausted || false
      }
    } finally {
      loading.value  = false
      retrying.value = false
    }
  }

  async function retry() {
    retrying.value = true
    await fetchHealth()
  }

  function updateFromWebSocket(data) {
    if (data.sensors) sensors.value = { ...sensors.value, ...data.sensors }
    if (data.apis)    apis.value    = { ...apis.value,    ...data.apis }
    error.value = null
  }

  return { sensors, apis, loading, error, retrying, fetchHealth, retry, updateFromWebSocket }
})
