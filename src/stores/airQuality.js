import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useAirQualityStore = defineStore('airQuality', () => {
  const pm25    = ref({ value: null, status: 'ok' })
  const pm10    = ref({ value: null, status: 'ok' })
  const co      = ref({ value: null, status: 'ok' })
  const no2     = ref({ value: null, status: 'ok' })
  const o3      = ref({ value: null, status: 'ok' })
  const aqi     = ref({ value: null, status: 'ok' })
  const loading = ref(true)
  const error   = ref(null)
  const retrying = ref(false)

  async function fetchInitial() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getInitialData()
      const q = data.air_quality
      pm25.value = q.pm25
      pm10.value = q.pm10
      co.value   = q.co
      no2.value  = q.no2
      o3.value   = q.o3
      aqi.value  = q.aqi
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar calidad del aire',
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

  return { pm25, pm10, co, no2, o3, aqi, loading, error, retrying, fetchInitial, retry }
})
