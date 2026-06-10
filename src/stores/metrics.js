import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useMetricsStore = defineStore('metrics', () => {
  const comfort_score       = ref({ value: null, status: 'ok' })
  const water_autonomy_days = ref({ value: null, status: 'ok' })
  const energy_source       = ref({ solar_pct: 0, battery_pct: 0, grid_pct: 0 })
  const savings_eur_today   = ref({ value: null, status: 'ok' })
  const loading             = ref(true)
  const error               = ref(null)
  const retrying            = ref(false)

  async function fetchInitial() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getInitialData()
      const m = data.metrics
      comfort_score.value       = m.comfort_score
      water_autonomy_days.value = m.water_autonomy_days
      energy_source.value       = m.energy_source
      savings_eur_today.value   = m.savings_eur_today
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar métricas',
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
    if (data.comfort_score)       comfort_score.value       = { ...comfort_score.value, ...data.comfort_score }
    if (data.water_autonomy_days) water_autonomy_days.value = { ...water_autonomy_days.value, ...data.water_autonomy_days }
    if (data.energy_source)       energy_source.value       = { ...energy_source.value, ...data.energy_source }
    if (data.savings_eur_today)   savings_eur_today.value   = { ...savings_eur_today.value, ...data.savings_eur_today }
    error.value = null
  }

  return { comfort_score, water_autonomy_days, energy_source, savings_eur_today, loading, error, retrying, fetchInitial, retry, updateFromWebSocket }
})
