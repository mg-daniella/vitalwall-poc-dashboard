import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'

export const useRulesStore = defineStore('rules', () => {
  const rules    = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const retrying = ref(false)
  // Per-rule action errors (toggle/override)
  const actionError = ref(null)

  const activeRules    = computed(() => rules.value.filter(r => r.status === 'active'))
  const pendingRules   = computed(() => rules.value.filter(r => r.status === 'pending'))
  const completedRules = computed(() => rules.value.filter(r => r.status === 'completed'))
  const totalCount     = computed(() => rules.value.length)

  async function fetchRules() {
    const api = useApi()
    loading.value  = true
    error.value    = null
    retrying.value = false
    try {
      const data = await api.getRules()
      rules.value = Array.isArray(data) ? data : []
    } catch (err) {
      error.value = {
        message:        err.message || 'Error al cargar reglas',
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
    await fetchRules()
  }

  async function fetchHistory(period) {
    const api = useApi()
    try {
      const data = await api.getRulesHistory(period)
      const hist = Array.isArray(data) ? data : []
      hist.forEach(h => {
        if (!rules.value.find(r => r.id === h.id)) rules.value.push(h)
      })
    } catch (err) {
      error.value = { message: err.message || 'Error al cargar historial de reglas', status: err.status || null }
    }
  }

  async function toggleRule(id, status) {
    actionError.value = null
    const api = useApi()
    // Optimistic update
    const rule = rules.value.find(r => r.id === id)
    const prev = rule?.status
    if (rule) rule.status = status
    try {
      await api.toggleRule(id, status)
    } catch (err) {
      // Rollback on failure
      if (rule) rule.status = prev
      actionError.value = { id, message: err.message || 'No se pudo cambiar el estado de la regla' }
    }
  }

  async function overrideRule(id, payload) {
    actionError.value = null
    const api = useApi()
    try {
      await api.overrideRule(id, payload)
      await fetchRules()
    } catch (err) {
      actionError.value = { id, message: err.message || 'No se pudo aplicar el override' }
      throw err  // re-throw so the modal can show it
    }
  }

  return { rules, loading, error, retrying, actionError, activeRules, pendingRules, completedRules, totalCount, fetchRules, retry, fetchHistory, toggleRule, overrideRule }
})
