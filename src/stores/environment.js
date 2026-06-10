import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useEnvironmentStore = defineStore('environment', () => {
  const current  = ref({})
  const forecast = ref([])
  const loading  = ref(true)
  const error    = ref(null)
  const retrying = ref(false)

  async function fetchInitial() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getInitialData()
      current.value  = data.environmental.current
      forecast.value = data.environmental.forecast
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar datos ambientales',
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
    await fetchInitial()
  }

  function updateFromWebSocket(data) {
    if (data.current)  current.value  = { ...current.value,  ...data.current }
    if (data.forecast) forecast.value = data.forecast
    error.value = null
  }

  return { current, forecast, loading, error, retrying, fetchInitial, retry, updateFromWebSocket }
})
