import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSensorsStore }     from '@/stores/sensors'
import { useEnvironmentStore } from '@/stores/environment'
import { useMetricsStore }     from '@/stores/metrics'
import { useAlertsStore }      from '@/stores/alerts'
import { useSystemHealthStore }from '@/stores/systemHealth'
import { useWebSocketStore }   from '@/stores/websocket'

// ── Reproducimos la lógica del handler de useWebSocket ────────────────────
// (sin instanciar el WebSocket real)

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    getInitialData:  vi.fn().mockResolvedValue({ sensors: {}, environmental: { current: {}, forecast: [] }, air_quality: {}, metrics: {}, system_health: {} }),
    getSystemHealth: vi.fn().mockResolvedValue({ sensors: { status: 'ok', last_seen: null }, apis: {} })
  })
}))

vi.mock('@/stores/rules', () => ({
  useRulesStore: () => ({ fetchRules: vi.fn() })
}))

vi.mock('@/stores/airQuality', () => ({
  useAirQualityStore: () => ({ fetchInitial: vi.fn(), pm25: { value: null, status: 'ok' }, pm10: { value: null, status: 'ok' }, co: { value: null, status: 'ok' }, no2: { value: null, status: 'ok' }, o3: { value: null, status: 'ok' }, aqi: { value: null, status: 'ok' }, loading: false, error: null, retrying: false })
}))

vi.mock('@/stores/toasts', () => ({
  useToastsStore: () => ({ warning: vi.fn(), error: vi.fn() })
}))

function handleMessage(msg) {
  const wsStore = useWebSocketStore()
  wsStore.handleMessage(msg)

  const data = msg.payload ?? msg.data

  switch (msg.type) {
    case 'sensor_update':
      if (data) useSensorsStore().updateFromWebSocket(data)
      break
    case 'environmental_update':
      if (data) useEnvironmentStore().updateFromWebSocket(data)
      break
    case 'metrics_update':
      if (data) useMetricsStore().updateFromWebSocket(data)
      break
    case 'alert':
      if (data) useAlertsStore().addAlert(data)
      break
    case 'health_update':
      if (data) {
        const wsHealth = {}
        if ('sensor_online' in data) {
          wsHealth.sensors = { status: data.sensor_online ? 'ok' : 'danger', last_seen: data.last_seen || null }
        }
        if (data.sensors || data.apis) Object.assign(wsHealth, data)
        useSystemHealthStore().updateFromWebSocket(wsHealth)
      }
      useSystemHealthStore().fetchHealth().catch(() => {})
      break
  }
}

beforeEach(() => setActivePinia(createPinia()))

// ─────────────────────────────────────────────────────────────────────────────

describe('WebSocket handler — lectura de payload', () => {
  it('lee msg.payload cuando el servidor envía formato real', () => {
    const sensors = useSensorsStore()
    handleMessage({
      type: 'sensor_update',
      payload: { temperature: { value: 27.0, status: 'ok' } },
      timestamp: new Date().toISOString()
    })
    expect(sensors.temperature.value).toBe(27.0)
  })

  it('cae en msg.data como fallback (modo dummy)', () => {
    const sensors = useSensorsStore()
    handleMessage({
      type: 'sensor_update',
      data: { temperature: { value: 22.0, status: 'ok' } }
    })
    expect(sensors.temperature.value).toBe(22.0)
  })

  it('no lanza error si payload es undefined', () => {
    expect(() => handleMessage({ type: 'sensor_update' })).not.toThrow()
  })
})

describe('WebSocket handler — sensor_update', () => {
  it('actualiza temperatura, humedad, agua y batería', () => {
    const sensors = useSensorsStore()
    handleMessage({
      type: 'sensor_update',
      payload: {
        temperature:   { value: 25.0, status: 'ok' },
        humidity:      { value: 60.0, status: 'ok' },
        water_level:   { value: 80.0, status: 'ok' },
        battery_level: { value: 85.0, status: 'ok' }
      }
    })
    expect(sensors.temperature.value).toBe(25.0)
    expect(sensors.humidity.value).toBe(60.0)
    expect(sensors.water_level.value).toBe(80.0)
    expect(sensors.battery_level.value).toBe(85.0)
  })
})

describe('WebSocket handler — environmental_update', () => {
  it('actualiza el entorno exterior', () => {
    const env = useEnvironmentStore()
    handleMessage({
      type: 'environmental_update',
      payload: { current: { ext_temperature: { value: 38, status: 'danger' } } }
    })
    expect(env.current.ext_temperature.value).toBe(38)
  })
})

describe('WebSocket handler — metrics_update', () => {
  it('actualiza comfort_score', () => {
    const metrics = useMetricsStore()
    handleMessage({
      type: 'metrics_update',
      payload: { comfort_score: { value: 75, status: 'ok' } }
    })
    expect(metrics.comfort_score.value).toBe(75)
  })
})

describe('WebSocket handler — health_update', () => {
  it('sensor_online=true → sensors.status=ok', () => {
    const health = useSystemHealthStore()
    handleMessage({
      type: 'health_update',
      payload: { sensor_online: true, clients: 2, uptime_seconds: 3600 }
    })
    expect(health.sensors.status).toBe('ok')
  })

  it('sensor_online=false → sensors.status=danger', () => {
    const health = useSystemHealthStore()
    handleMessage({
      type: 'health_update',
      payload: { sensor_online: false, clients: 1, uptime_seconds: 100 }
    })
    expect(health.sensors.status).toBe('danger')
  })

  it('llama fetchHealth para refrescar estado completo de APIs', () => {
    const health = useSystemHealthStore()
    const spy = vi.spyOn(health, 'fetchHealth').mockResolvedValue()
    handleMessage({ type: 'health_update', payload: { sensor_online: true } })
    expect(spy).toHaveBeenCalledOnce()
  })
})

describe('WebSocket store — registro de eventos', () => {
  it('registra cada mensaje en la lista de eventos', () => {
    const wsStore = useWebSocketStore()
    const initialCount = wsStore.events.length
    handleMessage({ type: 'sensor_update', payload: { temperature: { value: 20, status: 'ok' } } })
    handleMessage({ type: 'metrics_update', payload: { comfort_score: { value: 80, status: 'ok' } } })
    expect(wsStore.events.length).toBe(initialCount + 2)
  })

  it('no acumula más de 50 eventos', () => {
    const wsStore = useWebSocketStore()
    for (let i = 0; i < 60; i++) {
      handleMessage({ type: 'sensor_update', payload: {} })
    }
    expect(wsStore.events.length).toBeLessThanOrEqual(50)
  })
})
