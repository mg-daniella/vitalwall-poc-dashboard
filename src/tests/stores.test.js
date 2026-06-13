import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSensorsStore }     from '@/stores/sensors'
import { useEnvironmentStore } from '@/stores/environment'
import { useMetricsStore }     from '@/stores/metrics'
import { useAirQualityStore }  from '@/stores/airQuality'
import { useSystemHealthStore }from '@/stores/systemHealth'

// Mocks configurables — se pueden sobreescribir por test con mockResolvedValueOnce
const mockGetInitialData  = vi.fn()
const mockGetSystemHealth = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    getInitialData:  mockGetInitialData,
    getSystemHealth: mockGetSystemHealth
  })
}))

const INITIAL_DATA = {
  sensors: {
    temperature:   { value: 24.5, status: 'ok' },
    humidity:      { value: 58.0, status: 'ok' },
    water_level:   { value: 75.0, status: 'ok' },
    battery_level: { value: 90.0, status: 'ok' }
  },
  environmental: {
    current:  { ext_temperature: { value: 32, status: 'warning' } },
    forecast: []
  },
  air_quality: {
    pm25: { value: 12, status: 'ok' },
    pm10: { value: 20, status: 'ok' },
    co:   { value: 0.3, status: 'ok' },
    no2:  { value: 15, status: 'ok' },
    o3:   { value: 40, status: 'ok' },
    aqi:  { value: 2,  status: 'ok' }
  },
  metrics: {
    comfort_score:       { value: 82,  status: 'ok' },
    water_autonomy_days: { value: 12,  status: 'ok' },
    energy_source:       { solar_pct: 60, battery_pct: 10, grid_pct: 30 },
    savings_eur_today:   { value: 3.5, status: 'ok' }
  },
  system_health: {}
}

const HEALTH_DATA = {
  sensors: { status: 'ok', last_seen: '2026-06-13T10:00:00Z' },
  apis: {
    open_meteo: { status: 'ok', last_updated: '2026-06-13T10:00:00Z' },
    nasa_power: { status: 'ok', last_updated: '2026-06-13T06:00:00Z' },
    redata:     { status: 'ok', last_updated: '2026-06-13T10:00:00Z' },
    effis:      { status: 'ok', last_updated: '2026-06-13T09:00:00Z' },
    aemet:      { status: 'ok', last_updated: '2026-06-13T10:00:00Z' }
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockGetInitialData.mockResolvedValue(INITIAL_DATA)
  mockGetSystemHealth.mockResolvedValue(HEALTH_DATA)
})

// ── Sensors store ──────────────────────────────────────────────────────────

describe('sensorsStore', () => {
  it('estado inicial tiene valores null', () => {
    const store = useSensorsStore()
    expect(store.temperature.value).toBeNull()
    expect(store.loading).toBe(true)
    expect(store.error).toBeNull()
  })

  it('fetchInitial carga datos correctamente', async () => {
    const store = useSensorsStore()
    await store.fetchInitial()
    expect(store.temperature.value).toBe(24.5)
    expect(store.humidity.value).toBe(58.0)
    expect(store.water_level.value).toBe(75.0)
    expect(store.battery_level.value).toBe(90.0)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('updateFromWebSocket actualiza valores parcialmente', async () => {
    const store = useSensorsStore()
    await store.fetchInitial()
    store.updateFromWebSocket({ temperature: { value: 26.0, status: 'warning' } })
    expect(store.temperature.value).toBe(26.0)
    expect(store.temperature.status).toBe('warning')
    expect(store.humidity.value).toBe(58.0) // sin cambio
  })

  it('updateFromWebSocket limpia el error previo', () => {
    const store = useSensorsStore()
    store.error = { message: 'fallo anterior' }
    store.updateFromWebSocket({ temperature: { value: 25, status: 'ok' } })
    expect(store.error).toBeNull()
  })

  it('fetchInitial registra error si la API falla', async () => {
    mockGetInitialData.mockRejectedValueOnce(
      Object.assign(new Error('Network error'), { status: 503, retryExhausted: true })
    )
    const store = useSensorsStore()
    await store.fetchInitial()
    expect(store.error).not.toBeNull()
    expect(store.error.message).toBe('Network error')
    expect(store.error.retryExhausted).toBe(true)
    expect(store.loading).toBe(false)
  })
})

// ── Environment store ──────────────────────────────────────────────────────

describe('environmentStore', () => {
  it('fetchInitial carga current y forecast', async () => {
    const store = useEnvironmentStore()
    await store.fetchInitial()
    expect(store.current.ext_temperature.value).toBe(32)
    expect(store.forecast).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('updateFromWebSocket fusiona current sin sobrescribir todo', async () => {
    const store = useEnvironmentStore()
    await store.fetchInitial()
    store.updateFromWebSocket({ current: { wind_kmh: { value: 15, status: 'ok' } } })
    expect(store.current.ext_temperature.value).toBe(32)
    expect(store.current.wind_kmh.value).toBe(15)
  })

  it('updateFromWebSocket reemplaza forecast completo', async () => {
    const store = useEnvironmentStore()
    await store.fetchInitial()
    const newForecast = [{ hour: '14:00', temp: 35 }]
    store.updateFromWebSocket({ forecast: newForecast })
    expect(store.forecast).toEqual(newForecast)
  })
})

// ── Metrics store ──────────────────────────────────────────────────────────

describe('metricsStore', () => {
  it('fetchInitial carga métricas correctamente', async () => {
    const store = useMetricsStore()
    await store.fetchInitial()
    expect(store.comfort_score.value).toBe(82)
    expect(store.water_autonomy_days.value).toBe(12)
    expect(store.energy_source.solar_pct).toBe(60)
    expect(store.savings_eur_today.value).toBe(3.5)
  })

  it('updateFromWebSocket actualiza solo los campos recibidos', async () => {
    const store = useMetricsStore()
    await store.fetchInitial()
    store.updateFromWebSocket({ comfort_score: { value: 90, status: 'ok' } })
    expect(store.comfort_score.value).toBe(90)
    expect(store.water_autonomy_days.value).toBe(12)
  })
})

// ── AirQuality store ───────────────────────────────────────────────────────

describe('airQualityStore', () => {
  it('fetchInitial carga todos los contaminantes', async () => {
    const store = useAirQualityStore()
    await store.fetchInitial()
    expect(store.pm25.value).toBe(12)
    expect(store.pm10.value).toBe(20)
    expect(store.aqi.value).toBe(2)
    expect(store.loading).toBe(false)
  })
})

// ── SystemHealth store ─────────────────────────────────────────────────────

describe('systemHealthStore', () => {
  it('fetchHealth carga sensores y APIs', async () => {
    const store = useSystemHealthStore()
    await store.fetchHealth()
    expect(store.sensors.status).toBe('ok')
    expect(store.apis.open_meteo.status).toBe('ok')
    expect(store.apis.redata.status).toBe('ok')
    expect(store.loading).toBe(false)
  })

  it('updateFromWebSocket con sensors.status=danger lo aplica', () => {
    const store = useSystemHealthStore()
    store.updateFromWebSocket({ sensors: { status: 'danger', last_seen: null } })
    expect(store.sensors.status).toBe('danger')
  })

  it('updateFromWebSocket con sensors.status=ok lo mantiene', () => {
    const store = useSystemHealthStore()
    store.updateFromWebSocket({ sensors: { status: 'ok', last_seen: '2026-06-13T10:00:00Z' } })
    expect(store.sensors.status).toBe('ok')
  })

  it('updateFromWebSocket no toca apis si no vienen en el payload', () => {
    const store = useSystemHealthStore()
    store.updateFromWebSocket({ sensors: { status: 'danger', last_seen: null } })
    expect(store.apis.open_meteo.status).toBe('ok')
  })
})
