import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dummyAlerts } from '@/data/dummy'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref([...dummyAlerts])

  const activeCount = computed(() => alerts.value.filter(a => !a.acknowledged).length)

  function addAlert(alert) {
    alerts.value.unshift({ ...alert, acknowledged: false })
    if (alerts.value.length > 100) alerts.value.pop()
  }

  function acknowledgeAlert(id) {
    const a = alerts.value.find(a => a.id === id)
    if (a) a.acknowledged = true
  }

  return { alerts, activeCount, addAlert, acknowledgeAlert }
})
