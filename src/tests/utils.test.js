import { describe, it, expect } from 'vitest'

// ── Helpers extracted inline (same logic as Historico.vue) ────────────────
function stats(arr) {
  if (!arr?.length) return { min: '—', max: '—', avg: '—', range: '—' }
  const vals  = arr.map(p => p.v)
  const min   = vals.reduce((a, b) => a < b ? a : b)
  const max   = vals.reduce((a, b) => a > b ? a : b)
  const avg   = vals.reduce((a, b) => a + b, 0) / vals.length
  return { min: min.toFixed(1), max: max.toFixed(1), avg: avg.toFixed(1), range: (max - min).toFixed(1) }
}

function downsample(arr, maxPts = 300) {
  if (!arr?.length || arr.length <= maxPts) return arr
  const step = arr.length / maxPts
  return Array.from({ length: maxPts }, (_, i) => arr[Math.round(i * step)])
}

// ── normalizeEnvironmental forecast filter (same logic as useApi.js) ───────
function filterFutureForecast(forecast, now = new Date().toISOString()) {
  return (forecast || []).filter(f => !f.timestamp || f.timestamp > now)
}

// ── normalizeHistory (same logic as useApi.js) ────────────────────────────
function normalizeHistory(raw) {
  const temperature = [], humidity = [], water_level = []
  const points = Array.isArray(raw) ? raw : (raw.data || [])
  points.forEach(pt => {
    const t = pt.timestamp || null
    if (!t) return
    if (pt.temperature != null) temperature.push({ t, v: pt.temperature })
    if (pt.humidity    != null) humidity.push(   { t, v: pt.humidity })
    if (pt.water_level != null) water_level.push({ t, v: pt.water_level })
  })
  return { temperature, humidity, water_level }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('stats()', () => {
  it('devuelve guiones cuando el array está vacío', () => {
    expect(stats([])).toEqual({ min: '—', max: '—', avg: '—', range: '—' })
  })

  it('devuelve guiones cuando el array es null', () => {
    expect(stats(null)).toEqual({ min: '—', max: '—', avg: '—', range: '—' })
  })

  it('calcula correctamente con un único valor', () => {
    const result = stats([{ v: 25 }])
    expect(result.min).toBe('25.0')
    expect(result.max).toBe('25.0')
    expect(result.avg).toBe('25.0')
    expect(result.range).toBe('0.0')
  })

  it('calcula min, max, avg y range correctamente', () => {
    const arr = [{ v: 20 }, { v: 25 }, { v: 30 }]
    const result = stats(arr)
    expect(result.min).toBe('20.0')
    expect(result.max).toBe('30.0')
    expect(result.avg).toBe('25.0')
    expect(result.range).toBe('10.0')
  })

  it('no revienta con arrays muy grandes (43000 puntos)', () => {
    const big = Array.from({ length: 43000 }, (_, i) => ({ v: 20 + (i % 10) }))
    expect(() => stats(big)).not.toThrow()
  })
})

describe('downsample()', () => {
  it('devuelve el mismo array si tiene menos puntos que el límite', () => {
    const arr = [{ v: 1 }, { v: 2 }, { v: 3 }]
    expect(downsample(arr, 300)).toHaveLength(3)
  })

  it('reduce a maxPts cuando el array es mayor', () => {
    const big = Array.from({ length: 1000 }, (_, i) => ({ v: i }))
    expect(downsample(big, 300)).toHaveLength(300)
  })

  it('devuelve array vacío con entrada vacía', () => {
    expect(downsample([], 300)).toHaveLength(0)
  })

  it('el primer y último punto se conservan', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => ({ v: i }))
    const result = downsample(arr, 300)
    expect(result[0].v).toBe(0)
  })
})

describe('filterFutureForecast()', () => {
  it('filtra timestamps pasados', () => {
    const now = '2026-06-13T12:00:00Z'
    const forecast = [
      { timestamp: '2026-06-13T10:00:00Z' },
      { timestamp: '2026-06-13T13:00:00Z' },
      { timestamp: '2026-06-13T14:00:00Z' },
    ]
    const result = filterFutureForecast(forecast, now)
    expect(result).toHaveLength(2)
    expect(result[0].timestamp).toBe('2026-06-13T13:00:00Z')
  })

  it('mantiene items sin timestamp', () => {
    const forecast = [{ hour: '10:00' }, { hour: '14:00' }]
    expect(filterFutureForecast(forecast, '2026-06-13T12:00:00Z')).toHaveLength(2)
  })

  it('devuelve vacío con forecast null', () => {
    expect(filterFutureForecast(null)).toHaveLength(0)
  })
})

describe('normalizeHistory()', () => {
  it('procesa el formato real de la API { data: [{timestamp, ...}] }', () => {
    const raw = {
      period: '1h', count: 2,
      data: [
        { timestamp: '2026-06-13T10:00', temperature: 22.5, humidity: 55, water_level: 80 },
        { timestamp: '2026-06-13T10:01', temperature: 23.1, humidity: 54, water_level: 79 }
      ]
    }
    const result = normalizeHistory(raw)
    expect(result.temperature).toHaveLength(2)
    expect(result.humidity).toHaveLength(2)
    expect(result.water_level).toHaveLength(2)
    expect(result.temperature[0]).toEqual({ t: '2026-06-13T10:00', v: 22.5 })
  })

  it('omite campos null — no añade puntos vacíos', () => {
    const raw = { data: [
      { timestamp: '2026-06-13T10:00', temperature: 22.5, humidity: null, water_level: null }
    ]}
    const result = normalizeHistory(raw)
    expect(result.temperature).toHaveLength(1)
    expect(result.humidity).toHaveLength(0)
    expect(result.water_level).toHaveLength(0)
  })

  it('procesa también arrays planos (sin wrapper)', () => {
    const raw = [
      { timestamp: '2026-06-13T08:00', temperature: 20, humidity: 60, water_level: 70 }
    ]
    const result = normalizeHistory(raw)
    expect(result.temperature).toHaveLength(1)
  })

  it('omite puntos sin timestamp', () => {
    const raw = { data: [
      { temperature: 20, humidity: 60 },
      { timestamp: '2026-06-13T10:00', temperature: 22, humidity: 55, water_level: 80 }
    ]}
    const result = normalizeHistory(raw)
    expect(result.temperature).toHaveLength(1)
  })

  it('devuelve arrays vacíos con respuesta vacía', () => {
    const result = normalizeHistory({ data: [] })
    expect(result.temperature).toHaveLength(0)
    expect(result.humidity).toHaveLength(0)
    expect(result.water_level).toHaveLength(0)
  })
})
