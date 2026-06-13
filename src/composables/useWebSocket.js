// WebSocket composable — singleton: only one WS connection exists at any time
import { ref } from 'vue'
import { useSensorsStore }     from '@/stores/sensors'
import { useEnvironmentStore } from '@/stores/environment'
import { useAirQualityStore }  from '@/stores/airQuality'
import { useRulesStore }       from '@/stores/rules'
import { useMetricsStore }     from '@/stores/metrics'
import { useAlertsStore }      from '@/stores/alerts'
import { useSystemHealthStore }from '@/stores/systemHealth'
import { useWebSocketStore }   from '@/stores/websocket'
import { useToastsStore }      from '@/stores/toasts'

const WS_URL    = import.meta.env.VITE_WS_URL
const API_KEY   = import.meta.env.VITE_API_KEY
const USE_DUMMY = import.meta.env.VITE_USE_DUMMY === 'true'

const INITIAL_DELAY = 1000
const MAX_DELAY     = 30000

// ── Singleton state (module-level, shared across all callers) ─────────────
const connected = ref(false)
let ws                = null
let retryDelay        = INITIAL_DELAY
let retryTimeout      = null
let intentionalClose  = false
let consecutiveErrors = 0
let dummyInterval     = null

// ─────────────────────────────────────────────────────────────────────────────

function connect() {
  // Already connected — don't open a second socket
  if (ws && ws.readyState === WebSocket.OPEN) return
  if (USE_DUMMY) {
    connected.value = true
    useWebSocketStore().connected = true
    startDummySimulation()
    return
  }

  intentionalClose = false
  try {
    ws = new WebSocket(`${WS_URL}?apiKey=${API_KEY}`)
  } catch (err) {
    handleConnectError(err)
    scheduleReconnect()
    return
  }

  ws.onopen = () => {
    connected.value = true
    useWebSocketStore().connected = true
    retryDelay = INITIAL_DELAY
    consecutiveErrors = 0
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      handleMessage(msg)
    } catch { /* ignore malformed frames */ }
  }

  ws.onclose = () => {
    connected.value = false
    useWebSocketStore().connected = false
    if (!intentionalClose) {
      consecutiveErrors++
      if (consecutiveErrors === 1) {
        useToastsStore().warning('Conexión WebSocket perdida. Reconectando…')
      }
      scheduleReconnect()
    }
  }

  ws.onerror = () => { ws?.close() }
}

function disconnect() {
  intentionalClose = true
  clearTimeout(retryTimeout)
  stopDummySimulation()
  if (ws) { ws.close(); ws = null }
  connected.value = false
  useWebSocketStore().connected = false
}

function scheduleReconnect() {
  clearTimeout(retryTimeout)
  retryTimeout = setTimeout(() => {
    retryDelay = Math.min(retryDelay * 2, MAX_DELAY)
    connect()
  }, retryDelay)
}

function handleConnectError(err) {
  useToastsStore().error(`WebSocket: no se pudo conectar. ${err?.message || ''}`)
}

function handleMessage(msg) {
  useWebSocketStore().handleMessage(msg)

  const data = msg.payload ?? msg.data

  switch (msg.type) {
    case 'sensor_update':
      if (data) useSensorsStore().updateFromWebSocket(data)
      break
    case 'environmental_update':
      if (data) useEnvironmentStore().updateFromWebSocket(data)
      break
    case 'air_quality_update':
      useAirQualityStore().fetchInitial().catch(() => {})
      break
    case 'rule_update':
      useRulesStore().fetchRules().catch(() => {})
      break
    case 'metrics_update':
      if (data) useMetricsStore().updateFromWebSocket(data)
      break
    case 'alert':
      if (data) useAlertsStore().addAlert({
        id:          data.id        ?? `ws-${Date.now()}`,
        code:        data.code      ?? 'UNKNOWN',
        severity:    data.severity  ?? data.level ?? 'warning',
        title:       data.title     ?? data.message ?? data.code ?? 'Alerta',
        description: data.description ?? data.message ?? '',
        source:      data.source    ?? 'sensor',
        ai_action:   data.ai_action ?? '',
        timestamp:   msg.timestamp  ?? new Date().toISOString()
      })
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

// ── Dummy simulation ──────────────────────────────────────────────────────

function startDummySimulation() {
  if (dummyInterval) return  // already running
  dummyInterval = setInterval(() => {
    const jitter = (base, range) => +(base + (Math.random() - 0.5) * range * 2).toFixed(1)
    handleMessage({
      type: 'sensor_update',
      data: {
        temperature:   { value: jitter(26.5, 0.5), status: 'ok' },
        humidity:      { value: jitter(45.2, 1.0), status: 'ok' },
        water_level:   { value: jitter(78.0, 0.3), status: 'ok' },
        battery_level: { value: jitter(85,   0.5), status: 'ok' }
      }
    })
  }, 8000)
}

function stopDummySimulation() {
  clearInterval(dummyInterval)
  dummyInterval = null
}

// ── Public API ────────────────────────────────────────────────────────────

export function useWebSocket() {
  return { connected, connect, disconnect }
}
