import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dummyWsEvents } from '@/data/dummy'

const USE_DUMMY = import.meta.env.VITE_USE_DUMMY === 'true'

export const useWebSocketStore = defineStore('websocket', () => {
  const connected  = ref(false)
  const last_event = ref(null)
  const events     = ref(USE_DUMMY ? [...dummyWsEvents] : [])

  function handleMessage(message) {
    last_event.value = message
    events.value.unshift({
      id:      Date.now(),
      type:    message.type,
      message: formatMessage(message),
      meta:    message.source || '',
      time:    new Date().toISOString()
    })
    if (events.value.length > 50) events.value.pop()
  }

  function formatMessage(msg) {
    const d = msg.payload ?? msg.data ?? {}
    switch (msg.type) {
      case 'sensor_update':        return `Sensores actualizados`
      case 'environmental_update': return `Entorno actualizado`
      case 'air_quality_update':   return `Calidad del aire actualizada`
      case 'rule_update':          return `Regla actualizada: ${d.title || ''}`
      case 'metrics_update':       return `Métricas recalculadas`
      case 'alert':                return `Alerta: ${d.title || ''}`
      case 'health_update':        return `Estado del sistema — sensores: ${d.sensor_online ? '✓' : '✗'}`
      case 'connected':            return d.message || 'WebSocket conectado'
      default:                     return JSON.stringify(msg).slice(0, 80)
    }
  }

  return { connected, last_event, events, handleMessage }
})
