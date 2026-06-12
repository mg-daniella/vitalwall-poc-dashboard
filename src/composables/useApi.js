// Fetch wrapper: real API + retry logic + response normalization + dummy fallback
import {
  dummySensors, dummyEnvironmental, dummyAirQuality,
  dummyMetrics, dummyRules, dummySystemHealth, dummyHistory
} from '@/data/dummy'

const USE_DUMMY = import.meta.env.VITE_USE_DUMMY === 'true'
const API_URL   = import.meta.env.VITE_API_URL
const API_KEY   = import.meta.env.VITE_API_KEY

// ─── Request deduplication ───────────────────────────────────────
// Multiple stores call getInitialData() simultaneously; cache the in-flight
// promise so /api/data is only fetched once per call cycle (TTL = 2s).
const _inFlight = {}
function dedupFetch(key, fn) {
  if (_inFlight[key]) return _inFlight[key]
  const p = fn().finally(() => { delete _inFlight[key] })
  _inFlight[key] = p
  return p
}

// ─── Retry config ────────────────────────────────────────────────
const MAX_RETRIES   = 3
const INITIAL_DELAY = 800
const MAX_DELAY     = 10000

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function isRetryable(status) {
  if (!status)       return true   // network error
  if (status === 429) return true  // rate-limited
  if (status >= 500)  return true  // server errors
  return false                     // 4xx — don't retry
}

async function apiFetch(path, options = {}) {
  let lastError
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          ...(options.headers || {})
        }
      })
      if (!res.ok) {
        const err = Object.assign(new Error(`HTTP ${res.status} on ${path}`), { status: res.status, attempt: i })
        if (!isRetryable(res.status)) throw err
        lastError = err
      } else {
        return res.json()
      }
    } catch (err) {
      if (err.status && !isRetryable(err.status)) throw err
      lastError = Object.assign(err, { attempt: i })
    }
    if (i < MAX_RETRIES) {
      const delay  = Math.min(INITIAL_DELAY * 2 ** (i - 1), MAX_DELAY)
      const jitter = delay * 0.2 * (Math.random() * 2 - 1)
      await sleep(Math.round(delay + jitter))
    }
  }
  lastError.retryExhausted = true
  throw lastError
}

// ─── Response normalizers ────────────────────────────────────────
// Maps the real API shape → the shape our Pinia stores expect

function normalizeInitialData(raw) {
  return {
    sensors:       raw.sensors,
    air_quality:   raw.air_quality,
    environmental: normalizeEnvironmental(raw.environmental_context || raw.environmental || {}),
    metrics:       normalizeMetrics(raw.calculated_metrics || raw.metrics || {}),
    rules:         [],          // not included in /api/data on the real backend
    system_health: raw.system_health || {}
  }
}

function normalizeEnvironmental(env) {
  return {
    current:  env.current || {},
    forecast: (env.forecast || []).map(f => ({
      hour:               f.timestamp ? f.timestamp.split('T')[1]?.slice(0, 5) : (f.hour || ''),
      temp:               f.temperature        ?? f.temp       ?? null,
      feels_like:         f.feels_like         ?? f.temperature ?? null,
      humidity:           f.humidity           ?? null,
      wind_kmh:           f.wind_kmh           ?? null,
      precipitation_prob: f.precipitation_prob ?? null
    }))
  }
}

function normalizeMetrics(m) {
  return {
    comfort_score:       m.comfort_score       || { value: null, status: 'ok' },
    water_autonomy_days: m.water_autonomy_days  || { value: null, status: 'ok' },
    energy_source:       m.energy_source        || { solar_pct: 0, battery_pct: 0, grid_pct: 0 },
    savings_eur_today:   m.savings_eur_today    || { value: null, status: 'ok' }
  }
}

function normalizeRules(raw) {
  // Real API wraps rules in { data: [...], total, limit, offset }
  const list = Array.isArray(raw) ? raw : (raw.data || [])
  return list.map(r => ({
    id:           String(r.id),
    title:        r.description || r.title || `Regla #${r.id}`,
    description:  r.condition   || r.description || '',
    status:       r.status,
    layer:        r.affected_layer || r.layer || '',
    source:       r.trigger_source || r.source || 'IA',
    duration:     r.duration_hours != null ? `${r.duration_hours}h` : (r.duration || ''),
    triggered_at: r.created_at   || r.triggered_at || null,
    completed_at: r.updated_at   || r.completed_at || null,
    tags:         r.tags         || []
  }))
}

function normalizeHistory(raw) {
  // Real API: { period, count, data: [{ date, intervals: [{ time, temperature, humidity, water_level, battery_level }] }] }
  // Expected: { temperature: [{t, v}], humidity: [{t,v}], water_level: [{t,v}] }
  const temperature = [], humidity = [], water_level = []

  const days = Array.isArray(raw) ? raw : (raw.data || [])
  days.forEach(day => {
    const intervals = day.intervals || []
    intervals.forEach(pt => {
      const isoDate = day.date || new Date().toISOString().split('T')[0]
      const isoTime = `${isoDate}T${pt.time || '00:00:00'}`
      if (pt.temperature  != null) temperature.push({ t: isoTime, v: pt.temperature })
      if (pt.humidity     != null) humidity.push(    { t: isoTime, v: pt.humidity })
      if (pt.water_level  != null) water_level.push( { t: isoTime, v: pt.water_level })
    })
  })

  return { temperature, humidity, water_level }
}

// ─── Dummy resolvers ─────────────────────────────────────────────
const dummyDelay = (ms = 400) => new Promise(r => setTimeout(r, ms))

async function dummyFetch(path, options = {}) {
  await dummyDelay()
  if (path === '/api/data') {
    return { sensors: dummySensors, environmental: dummyEnvironmental, air_quality: dummyAirQuality, metrics: dummyMetrics, rules: dummyRules, system_health: dummySystemHealth }
  }
  if (path.startsWith('/api/sensors/history'))   return dummyHistory
  if (path.startsWith('/api/rules/history'))      return dummyRules.filter(r => r.status === 'completed')
  if (path.startsWith('/api/rules') && !path.match(/\/\d+/)) return dummyRules
  if (path.startsWith('/api/system/health'))      return dummySystemHealth
  if (path.startsWith('/api/comfort') && options.method !== 'POST') {
    return { comfort_score: dummyMetrics.comfort_score, temperature_min: 20, temperature_max: 26, humidity_min: 40, humidity_max: 60 }
  }
  if (path.startsWith('/api/comfort') && options.method === 'POST') return { success: true }
  if (options.method === 'PATCH') return { success: true }
  return {}
}

// ─── Public API ──────────────────────────────────────────────────
export function useApi() {
  async function request(path, options = {}) {
    if (USE_DUMMY) return dummyFetch(path, options)
    return apiFetch(path, options)
  }

  return {
    async getInitialData() {
      const raw = await dedupFetch('initial', () => request('/api/data'))
      return USE_DUMMY ? raw : normalizeInitialData(raw)
    },

    async getSensorsHistory(period) {
      const raw = await request(`/api/sensors/history?period=${period}`)
      return USE_DUMMY ? raw : normalizeHistory(raw)
    },

    async getRules(limit = 20, offset = 0) {
      const raw = await request(`/api/rules?limit=${limit}&offset=${offset}`)
      return USE_DUMMY ? raw : normalizeRules(raw)
    },

    async getRulesHistory(period) {
      const raw = await request(`/api/rules/history?period=${period}`)
      return USE_DUMMY ? raw : normalizeRules(raw)
    },

    toggleRule:  (id, status)  => request(`/api/rules/${id}`,  { method: 'PATCH', body: JSON.stringify({ status }) }),
    overrideRule:(id, payload) => request(`/api/rules/${id}`,  { method: 'PATCH', body: JSON.stringify(payload) }),
    getSystemHealth: ()        => request('/api/system/health'),
    getComfort:      ()        => request('/api/comfort'),
    saveComfort: (payload)     => request('/api/comfort', { method: 'POST', body: JSON.stringify(payload) })
  }
}
