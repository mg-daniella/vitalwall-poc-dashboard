// Full dummy dataset — used when VITE_USE_DUMMY=true

export const dummySensors = {
  temperature:  { value: 26.5, unit: '°C', status: 'ok' },
  humidity:     { value: 45.2, unit: '%',  status: 'ok' },
  water_level:  { value: 78.0, unit: '%',  status: 'ok' },
  battery_level:{ value: 85,   unit: '%',  status: 'ok' }
}

export const dummyEnvironmental = {
  current: {
    ext_temperature:  { value: 33.2, unit: '°C', status: 'warning' },
    ext_humidity:     { value: 30.1, unit: '%',  status: 'ok' },
    wind_kmh:         { value: 12.5, unit: 'km/h', status: 'ok' },
    uv_index:         { value: 7,    unit: '',   status: 'warning' },
    renewables_pct:   { value: 65.2, unit: '%',  status: 'ok' },
    co2_g_kwh:        { value: 120,  unit: 'g/kWh', status: 'ok' },
    fire_risk_fwi:    { value: 25.4, unit: '',   status: 'warning' },
    water_balance_mm: { value: -15.2,unit: 'mm', status: 'ok' }
  },
  forecast: [
    { hour: '12:00', temp: 33.2, feels_like: 35.0 },
    { hour: '13:00', temp: 34.5, feels_like: 36.0 },
    { hour: '14:00', temp: 35.8, feels_like: 37.1 },
    { hour: '15:00', temp: 36.2, feels_like: 37.8 },
    { hour: '16:00', temp: 35.9, feels_like: 37.2 },
    { hour: '17:00', temp: 34.7, feels_like: 36.0 },
    { hour: '18:00', temp: 33.1, feels_like: 34.3 },
    { hour: '19:00', temp: 31.4, feels_like: 32.5 },
    { hour: '20:00', temp: 29.2, feels_like: 30.1 },
    { hour: '21:00', temp: 27.5, feels_like: 28.2 },
    { hour: '22:00', temp: 25.8, feels_like: 26.4 },
    { hour: '23:00', temp: 24.0, feels_like: 24.6 }
  ]
}

export const dummyAirQuality = {
  pm25: { value: 12.0, unit: 'µg/m³', status: 'ok' },
  pm10: { value: 18.0, unit: 'µg/m³', status: 'ok' },
  co:   { value: 0.4,  unit: 'mg/m³', status: 'ok' },
  no2:  { value: 22.0, unit: 'µg/m³', status: 'ok' },
  o3:   { value: 55.0, unit: 'µg/m³', status: 'ok' },
  aqi:  { value: 42,   unit: '',      status: 'ok' }
}

export const dummyMetrics = {
  comfort_score:       { value: 95,    unit: '/100', status: 'ok' },
  water_autonomy_days: { value: 12,    unit: 'días', status: 'ok' },
  energy_source: {
    solar_pct:   60,
    battery_pct: 30,
    grid_pct:    10
  },
  savings_eur_today: { value: 15.40, unit: '€', status: 'ok' }
}

export const dummyRules = [
  {
    id: 'rule-001',
    title: 'Ventilación nocturna activada',
    description: 'El sistema activa ventilación pasiva cuando temperatura exterior baja de 24°C',
    status: 'active',
    layer: 'ventilacion',
    source: 'IA',
    duration: '8h',
    triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['nocturno', 'temperatura', 'eficiencia']
  },
  {
    id: 'rule-002',
    title: 'Protección solar: lamas al 70%',
    description: 'Lamas exteriores ajustadas al 70% por índice UV > 6 y temperatura > 30°C',
    status: 'active',
    layer: 'proteccion_solar',
    source: 'IA',
    duration: '4h',
    triggered_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    tags: ['uv', 'calor', 'proteccion']
  },
  {
    id: 'rule-003',
    title: 'Recarga batería con excedente solar',
    description: 'Excedente fotovoltaico (>40%) redirigido a banco de baterías en horas valle',
    status: 'active',
    layer: 'energia',
    source: 'IA',
    duration: '2h',
    triggered_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    tags: ['solar', 'bateria', 'excedente']
  },
  {
    id: 'rule-004',
    title: 'Riego reducido por balance hídrico negativo',
    description: 'Riego exterior reducido un 30% por balance hídrico negativo y previsión de lluvia en 48h',
    status: 'completed',
    layer: 'agua',
    source: 'IA',
    duration: '24h',
    triggered_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['agua', 'riego', 'ahorro']
  }
]

export const dummySystemHealth = {
  sensors: {
    status: 'ok',
    last_seen: new Date(Date.now() - 30 * 1000).toISOString()
  },
  apis: {
    open_meteo: { status: 'ok',      last_updated: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    nasa_power: { status: 'ok',      last_updated: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    redata:     { status: 'ok',      last_updated: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
    effis:      { status: 'ok',      last_updated: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    aemet:      { status: 'ok',      last_updated: new Date(Date.now() - 2 * 60 * 1000).toISOString() }
  }
}

export const dummyAlerts = [
  {
    id: 'alert-001',
    code: 'UV_HIGH',
    source: 'Open-Meteo',
    severity: 'warning',
    title: 'Índice UV elevado',
    description: 'Índice UV de 7 registrado. Riesgo moderado-alto de exposición solar.',
    ai_action: 'Lamas exteriores ajustadas al 70% automáticamente.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: false
  },
  {
    id: 'alert-002',
    code: 'FIRE_RISK',
    source: 'EFFIS',
    severity: 'warning',
    title: 'Riesgo de incendio FWI 25.4',
    description: 'Índice FWI en umbral de aviso. Condiciones de viento y sequedad elevadas.',
    ai_action: 'Monitorizando cada 15 min. Sin acción estructural requerida aún.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false
  }
]

export const dummyWsEvents = [
  { id: 1, type: 'sensor_update',      message: 'Temperatura interior: 26.5°C',        meta: 'Sensor TH-01', time: new Date(Date.now() - 30 * 1000).toISOString() },
  { id: 2, type: 'rule_update',        message: 'Regla "Ventilación nocturna" activada', meta: 'Cerebro IA',   time: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 3, type: 'environmental_update', message: 'Ext temp: 33.2°C | Viento: 12.5 km/h', meta: 'Open-Meteo',  time: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 4, type: 'metrics_update',     message: 'Confort: 85/100 | Ahorro: 15.40€',    meta: 'Cálculo IA',   time: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
  { id: 5, type: 'air_quality_update', message: 'AQI: 42 — Calidad del aire buena',     meta: 'Sensor AQ-01', time: new Date(Date.now() - 12 * 60 * 1000).toISOString() }
]

// Sensor history arrays for the Historico view
const generateHistory = (baseVal, variance, count = 24) =>
  Array.from({ length: count }, (_, i) => ({
    t: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
    v: +(baseVal + (Math.random() - 0.5) * variance * 2).toFixed(1)
  }))

export const dummyHistory = {
  temperature: generateHistory(26.5, 2),
  humidity:    generateHistory(45, 5),
  water_level: generateHistory(78, 3)
}

// Wall layer sections (9 slabs: 3 floors × 3 sections)
export const dummyWallSections = {
  '1A': { floor: 'Planta 1', section: 'A', layer: 'Panel 1A — Fachada Norte', temp: 24.1, humidity: 48, solar_gain: 320, air_flow: 0.8, insulation: 92 },
  '1B': { floor: 'Planta 1', section: 'B', layer: 'Panel 1B — Fachada Norte', temp: 25.3, humidity: 46, solar_gain: 410, air_flow: 0.6, insulation: 88 },
  '1C': { floor: 'Planta 1', section: 'C', layer: 'Panel 1C — Fachada Norte', temp: 23.8, humidity: 52, solar_gain: 290, air_flow: 0.9, insulation: 94 },
  '2A': { floor: 'Planta 2', section: 'A', layer: 'Panel 2A — Fachada Norte', temp: 26.5, humidity: 44, solar_gain: 480, air_flow: 0.7, insulation: 90 },
  '2B': { floor: 'Planta 2', section: 'B', layer: 'Panel 2B — Fachada Norte', temp: 25.8, humidity: 45, solar_gain: 395, air_flow: 0.8, insulation: 91 },
  '2C': { floor: 'Planta 2', section: 'C', layer: 'Panel 2C — Fachada Norte', temp: 24.9, humidity: 47, solar_gain: 350, air_flow: 1.0, insulation: 89 },
  '3A': { floor: 'Planta 3', section: 'A', layer: 'Panel 3A — Fachada Norte', temp: 28.2, humidity: 41, solar_gain: 520, air_flow: 0.5, insulation: 87 },
  '3B': { floor: 'Planta 3', section: 'B', layer: 'Panel 3B — Fachada Norte', temp: 27.6, humidity: 43, solar_gain: 505, air_flow: 0.6, insulation: 88 },
  '3C': { floor: 'Planta 3', section: 'C', layer: 'Panel 3C — Fachada Norte', temp: 27.0, humidity: 42, solar_gain: 465, air_flow: 0.7, insulation: 90 }
}

export const dummyApiLog = [
  { id: 1, time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),  source: 'Open-Meteo', message: 'Forecast 12h actualizado',      payload: '{ temperature_2m: [33.2, ...] }', status: 'ok' },
  { id: 2, time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),  source: 'AEMET',      message: 'Alerta UV recibida',              payload: '{ uv_index: 7, level: "alto" }',   status: 'ok' },
  { id: 3, time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), source: 'EFFIS',      message: 'FWI actualizado a 25.4',          payload: '{ fwi: 25.4, risk: "medium" }',   status: 'ok' },
  { id: 4, time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), source: 'REData',     message: 'Mix energético 15:00',            payload: '{ renovables: 65.2% }',           status: 'ok' },
  { id: 5, time: new Date(Date.now() - 20 * 60 * 1000).toISOString(), source: 'NASA POWER', message: 'Radiación solar actualizada',     payload: '{ irradiance: 820 W/m² }',        status: 'ok' },
  { id: 6, time: new Date(Date.now() - 32 * 60 * 1000).toISOString(), source: 'Open-Meteo', message: 'Error 429 — Rate limit',          payload: '{}',                              status: 'error' },
  { id: 7, time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), source: 'AEMET',      message: 'Datos de viento actualizados',    payload: '{ wind_speed: 12.5, dir: "NE" }', status: 'ok' }
]
