<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSensorsStore } from '@/stores/sensors'
import { useMetricsStore } from '@/stores/metrics'
import { useApi }          from '@/composables/useApi'
import InsightBox  from '@/components/ui/InsightBox.vue'
import { useToastsStore } from '@/stores/toasts'

const toasts  = useToastsStore()
const sensors = useSensorsStore()
const metrics = useMetricsStore()
const api     = useApi()

const tempMin = ref(20)
const tempMax = ref(26)
const humMin  = ref(40)
const humMax  = ref(60)
const saving  = ref(false)
const saved   = ref(false)

onMounted(async () => {
  const data = await api.getComfort()
  tempMin.value = data.temperature_min ?? 20
  tempMax.value = data.temperature_max ?? 26
  humMin.value  = data.humidity_min    ?? 40
  humMax.value  = data.humidity_max    ?? 60
})

async function saveConfig() {
  saving.value = true
  try {
    await api.saveComfort({
      temperature_min: tempMin.value, temperature_max: tempMax.value,
      humidity_min: humMin.value,     humidity_max: humMax.value
    })
    saved.value = true
    toasts.success('Configuración de confort guardada')
    setTimeout(() => saved.value = false, 2500)
  } catch (err) {
    toasts.error('No se pudo guardar la configuración: ' + (err.message || 'error desconocido'))
  } finally {
    saving.value = false
  }
}

// ── Status ──
const tempVal     = computed(() => sensors.temperature?.value ?? null)
const humVal      = computed(() => sensors.humidity?.value    ?? null)
const score       = 95
const tempInRange = computed(() => tempVal.value != null && tempVal.value >= tempMin.value && tempVal.value <= tempMax.value)
const humInRange  = computed(() => humVal.value  != null && humVal.value  >= humMin.value  && humVal.value  <= humMax.value)

// ── Radial gauge ──
const GAUGE_R  = 70
const GAUGE_CX = 100
const GAUGE_CY = 105
const ARC_DEG  = 220

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const s = polarToXY(cx, cy, r, startDeg)
  const e = polarToXY(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

const GAUGE_START = 160
const GAUGE_END   = 20

const gaugeTrackPath = computed(() => describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, GAUGE_START, GAUGE_START + ARC_DEG))

const gaugePotentialPath = computed(() => describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, GAUGE_START, GAUGE_START + ARC_DEG))

const gaugeValuePath = computed(() => {
  const pct  = Math.min(Math.max(score / 100, 0), 1)
  const sweep = pct * ARC_DEG
  if (sweep < 1) return ''
  return describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, GAUGE_START, GAUGE_START + sweep)
})

const gaugeDotPos = computed(() => {
  const pct   = Math.min(Math.max(score / 100, 0), 1)
  const angle = GAUGE_START + pct * ARC_DEG
  return polarToXY(GAUGE_CX, GAUGE_CY, GAUGE_R, angle)
})

// ── Range band ──
function bandPct(val, absMin, absMax) {
  if (val == null) return null
  return Math.min(Math.max(((val - absMin) / (absMax - absMin)) * 100, 0), 100)
}
function zonePct(v, absMin, absMax) {
  return Math.min(Math.max(((v - absMin) / (absMax - absMin)) * 100, 0), 100)
}

// ── Sparkline ──
function mockSparkline(base, count = 16) {
  if (base == null) return []
  const pts = []
  let v = base
  for (let i = 0; i < count; i++) {
    v = v + (Math.random() - 0.5) * 1.2
    pts.push(Math.round(v * 10) / 10)
  }
  pts[pts.length - 1] = base
  return pts
}
const tempSparkline = computed(() => mockSparkline(tempVal.value))
const humSparkline  = computed(() => mockSparkline(humVal.value))

const W = 240, H = 52

function sparkPoints(pts) {
  if (!pts.length) return []
  const mn = Math.min(...pts), mx = Math.max(...pts)
  const range = mx - mn || 1
  const xStep = W / (pts.length - 1)
  return pts.map((v, i) => ({
    x: i * xStep,
    y: H - ((v - mn) / range) * (H - 6) - 3
  }))
}

function sparkLinePath(pts) {
  const p = sparkPoints(pts)
  if (!p.length) return ''
  return p.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
}

function sparkAreaPath(pts) {
  const p = sparkPoints(pts)
  if (!p.length) return ''
  const line = p.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
  return `${line} L ${W} ${H} L 0 ${H} Z`
}

function sparkMinMax(pts) {
  if (!pts.length) return { min: null, max: null }
  return { min: Math.min(...pts), max: Math.max(...pts) }
}

// Trend: compare last value vs first value
function trendDir(pts) {
  if (pts.length < 2) return null
  const delta = pts[pts.length - 1] - pts[0]
  if (Math.abs(delta) < 0.1) return 'flat'
  return delta > 0 ? 'up' : 'down'
}
function trendDelta(pts) {
  if (pts.length < 2) return null
  return Math.abs(pts[pts.length - 1] - pts[0]).toFixed(1)
}

const tempStats = computed(() => ({
  pts: tempSparkline.value,
  ...sparkMinMax(tempSparkline.value),
  trend: trendDir(tempSparkline.value),
  delta: trendDelta(tempSparkline.value),
}))
const humStats = computed(() => ({
  pts: humSparkline.value,
  ...sparkMinMax(humSparkline.value),
  trend: trendDir(humSparkline.value),
  delta: trendDelta(humSparkline.value),
}))

// Comfort score breakdown text
const comfortBreakdown = computed(() => {
  if (score >= 85) return 'Condiciones óptimas. Temperatura y humedad dentro del rango ideal.'
  if (score >= 65) return 'Confort aceptable. Uno o más parámetros próximos al límite del rango.'
  return 'Confort reducido. Se recomienda ajustar ventilación o protección solar.'
})
</script>

<template>
  <div class="view-inner confort">

    <!-- ── Top: InsightBox full-width ── -->
    <InsightBox
      text="Rangos actuales optimizados para clima mediterráneo veraniego. El sistema ajustará ventilación y protección solar para mantener estos parámetros."
    />

    <div class="confort-layout">

      <!-- ══ LEFT: live readings ══ -->
      <div class="left-col">

        <!-- Temperatura -->
        <div class="card reading-card">
          <div class="reading-hd">
            <div class="reading-meta">
              <span class="reading-label">Temperatura</span>
              <span class="status-pill" :class="tempInRange ? 'pill-in' : 'pill-out'">
                <span class="status-dot-inline"></span>
                {{ tempInRange ? 'En rango' : 'Fuera de rango' }}
              </span>
            </div>
            <div class="reading-num-row">
              <div class="reading-big">
                {{ tempVal ?? '—' }}<span class="reading-unit">°C</span>
              </div>
              <div v-if="tempStats.trend && tempStats.trend !== 'flat'" class="trend-badge">
                <i :class="`ti ti-trending-${tempStats.trend === 'up' ? 'up' : 'down'}`"></i>
                {{ tempStats.delta }}°
              </div>
            </div>
          </div>

          <!-- Range band -->
          <div class="band-wrap">
            <div class="band-track">
              <div class="band-zone"
                :style="{
                  left:  zonePct(tempMin, 14, 32) + '%',
                  width: (zonePct(tempMax, 14, 32) - zonePct(tempMin, 14, 32)) + '%'
                }"
              ></div>
              <div class="band-zone-tick zone-tick-left"
                :style="{ left: zonePct(tempMin, 14, 32) + '%' }"
              ></div>
              <div class="band-zone-tick zone-tick-right"
                :style="{ left: zonePct(tempMax, 14, 32) + '%' }"
              ></div>
              <div v-if="tempVal != null" class="band-pin"
                :style="{ left: bandPct(tempVal, 14, 32) + '%' }"
              ></div>
            </div>
            <div class="band-labels">
              <span>14°C</span>
              <span class="band-zone-label">{{ tempMin }}° – {{ tempMax }}° rango confort</span>
              <span>32°C</span>
            </div>
          </div>

          <!-- Sparkline -->
          <div class="sparkline-section">
            <div class="spark-meta">
              <span class="spark-title">Últimas 16 lecturas</span>
              <span class="spark-range">
                <span class="spark-stat">↓ {{ tempStats.min?.toFixed(1) ?? '—' }}°</span>
                <span class="spark-stat">↑ {{ tempStats.max?.toFixed(1) ?? '—' }}°</span>
              </span>
            </div>
            <div class="sparkline-wrap">
              <svg class="sparkline-svg" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--blue-raw)" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="var(--blue-raw)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Comfort zone reference band -->
                <rect
                  :y="H - ((tempMax - 14) / 18) * (H - 6) - 3"
                  x="0" :width="W"
                  :height="((tempMax - tempMin) / 18) * (H - 6)"
                  fill="rgba(55,138,221,0.06)"
                />
                <!-- Area fill -->
                <path :d="sparkAreaPath(tempStats.pts)" fill="url(#temp-fill)"/>
                <!-- Line -->
                <path :d="sparkLinePath(tempStats.pts)" fill="none"
                      stroke="var(--blue-raw)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                <!-- Current value dot -->
                <circle v-if="tempStats.pts.length"
                  :cx="W"
                  :cy="sparkPoints(tempStats.pts).at(-1)?.y ?? H/2"
                  r="3" fill="var(--blue-raw)"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Humedad -->
        <div class="card reading-card">
          <div class="reading-hd">
            <div class="reading-meta">
              <span class="reading-label">Humedad</span>
              <span class="status-pill" :class="humInRange ? 'pill-in' : 'pill-out'">
                <span class="status-dot-inline"></span>
                {{ humInRange ? 'En rango' : 'Fuera de rango' }}
              </span>
            </div>
            <div class="reading-num-row">
              <div class="reading-big">
                {{ humVal ?? '—' }}<span class="reading-unit">%</span>
              </div>
              <div v-if="humStats.trend && humStats.trend !== 'flat'" class="trend-badge">
                <i :class="`ti ti-trending-${humStats.trend === 'up' ? 'up' : 'down'}`"></i>
                {{ humStats.delta }}%
              </div>
            </div>
          </div>

          <!-- Range band -->
          <div class="band-wrap">
            <div class="band-track">
              <div class="band-zone"
                :style="{
                  left:  zonePct(humMin, 20, 80) + '%',
                  width: (zonePct(humMax, 20, 80) - zonePct(humMin, 20, 80)) + '%'
                }"
              ></div>
              <div class="band-zone-tick zone-tick-left"
                :style="{ left: zonePct(humMin, 20, 80) + '%' }"
              ></div>
              <div class="band-zone-tick zone-tick-right"
                :style="{ left: zonePct(humMax, 20, 80) + '%' }"
              ></div>
              <div v-if="humVal != null" class="band-pin"
                :style="{ left: bandPct(humVal, 20, 80) + '%' }"
              ></div>
            </div>
            <div class="band-labels">
              <span>20%</span>
              <span class="band-zone-label">{{ humMin }}% – {{ humMax }}% rango confort</span>
              <span>80%</span>
            </div>
          </div>

          <!-- Sparkline -->
          <div class="sparkline-section">
            <div class="spark-meta">
              <span class="spark-title">Últimas 16 lecturas</span>
              <span class="spark-range">
                <span class="spark-stat">↓ {{ humStats.min?.toFixed(1) ?? '—' }}%</span>
                <span class="spark-stat">↑ {{ humStats.max?.toFixed(1) ?? '—' }}%</span>
              </span>
            </div>
            <div class="sparkline-wrap">
              <svg class="sparkline-svg" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hum-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--blue-raw)" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="var(--blue-raw)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <rect
                  :y="H - ((humMax - 20) / 60) * (H - 6) - 3"
                  x="0" :width="W"
                  :height="((humMax - humMin) / 60) * (H - 6)"
                  fill="rgba(55,138,221,0.06)"
                />
                <path :d="sparkAreaPath(humStats.pts)" fill="url(#hum-fill)"/>
                <path :d="sparkLinePath(humStats.pts)" fill="none"
                      stroke="var(--blue-raw)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                <circle v-if="humStats.pts.length"
                  :cx="W"
                  :cy="sparkPoints(humStats.pts).at(-1)?.y ?? H/2"
                  r="3" fill="var(--blue-raw)"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      <!-- ══ CENTER: comfort score gauge ══ -->
      <div class="center-col">
        <div class="card gauge-card">
          <div class="card-label center">Puntuación de confort</div>

          <svg viewBox="0 0 200 140" class="gauge-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Potential arc: full 100%, light blue -->
            <path :d="gaugePotentialPath" fill="none" stroke="var(--blue-raw)" stroke-width="10" stroke-linecap="round" opacity="0.15"/>
            <!-- Actual arc: 95% -->
            <path :d="gaugeValuePath" fill="none" stroke="var(--blue-raw)" stroke-width="10" stroke-linecap="round"/>
            <g v-if="gaugeDotPos">
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="9" fill="var(--blue-raw)" opacity="0.2"/>
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="6" fill="var(--blue-raw)"/>
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="2.5" fill="white"/>
            </g>
            <text :x="GAUGE_CX" :y="GAUGE_CY + 4" text-anchor="middle"
                  font-size="28" font-weight="700" fill="var(--text)" font-family="Inter">
              95
            </text>
            <text :x="GAUGE_CX" :y="GAUGE_CY + 20" text-anchor="middle"
                  font-size="10" fill="var(--text-muted)" font-family="Inter">
              / 100
            </text>
          </svg>

          <div class="gauge-legend">
            <div class="gauge-leg-item">
              <span class="leg-dot" style="background:var(--card-alt)"></span>
              <span>Potencial</span>
            </div>
            <div class="gauge-leg-item">
              <span class="leg-dot" style="background:var(--blue-raw)"></span>
              <span>Actual</span>
            </div>
          </div>

          <!-- Comfort breakdown (replaces redundant conditions list) -->
          <div class="comfort-breakdown">
            <div class="breakdown-icon">
              <i class="ti ti-info-circle"></i>
            </div>
            <p class="breakdown-text">{{ comfortBreakdown }}</p>
          </div>
        </div>
      </div>

      <!-- ══ RIGHT: config ══ -->
      <div class="right-col card config-card">
        <div class="card-label">Configurar rangos</div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">
              <i class="ti ti-thermometer" aria-hidden="true"></i>
              Temp. mínima
            </span>
            <span class="slider-val">{{ tempMin }}°C</span>
          </div>
          <input type="range" v-model.number="tempMin" min="15" max="25" step="0.5" class="slider" />
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">
              <i class="ti ti-thermometer" aria-hidden="true"></i>
              Temp. máxima
            </span>
            <span class="slider-val">{{ tempMax }}°C</span>
          </div>
          <input type="range" v-model.number="tempMax" min="20" max="30" step="0.5" class="slider" />
        </div>

        <div class="slider-divider"></div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">
              <i class="ti ti-droplet" aria-hidden="true"></i>
              Humedad mínima
            </span>
            <span class="slider-val">{{ humMin }}%</span>
          </div>
          <div class="slider-wrap">
            <input type="range" v-model.number="humMin" min="20" max="80" step="1" class="slider" />
            <div class="slider-marks">
              <div class="slider-mark" style="left: 33.3%"><span class="mark-label">40%</span></div>
            </div>
          </div>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">
              <i class="ti ti-droplet" aria-hidden="true"></i>
              Humedad máxima
            </span>
            <span class="slider-val">{{ humMax }}%</span>
          </div>
          <div class="slider-wrap">
            <input type="range" v-model.number="humMax" min="20" max="80" step="1" class="slider" />
            <div class="slider-marks">
              <div class="slider-mark" style="left: 66.7%"><span class="mark-label">60%</span></div>
            </div>
          </div>
        </div>

        <button class="save-btn" :disabled="saving" @click="saveConfig">
          <i :class="`ti ${saved ? 'ti-circle-check' : 'ti-device-floppy'}`" aria-hidden="true"></i>
          {{ saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar configuración' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.confort { display: flex; flex-direction: column; gap: 14px; }

/* ── 3-col layout ── */
.confort-layout {
  display: grid;
  grid-template-columns: 1fr 280px 260px;
  gap: 14px;
  align-items: start;
}

.card-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-secondary); margin-bottom: 14px;
}
.card-label.center { text-align: center; }

/* ══ LEFT ══ */
.left-col { display: flex; flex-direction: column; gap: 12px; }

.reading-card { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }

/* Header row: label + status pill + big number + trend */
.reading-hd { display: flex; flex-direction: column; gap: 8px; }

.reading-meta { display: flex; align-items: center; justify-content: space-between; }

.reading-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-secondary);
}

/* Status pill — blue only, no green */
.status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600;
  padding: 3px 9px; border-radius: 20px;
  border: 1px solid transparent;
}
.pill-in {
  background: rgba(55,138,221,0.10);
  border-color: rgba(55,138,221,0.25);
  color: var(--blue-raw);
}
.pill-out {
  background: var(--card-alt);
  border-color: var(--border-strong);
  color: var(--text-muted);
}
.status-dot-inline {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  background: currentColor;
}

/* Big number + trend badge */
.reading-num-row { display: flex; align-items: flex-end; gap: 12px; }
.reading-big { font-size: 48px; font-weight: 700; letter-spacing: -2px; color: var(--text); line-height: 1; }
.reading-unit { font-size: 18px; color: var(--text-secondary); margin-left: 2px; }

.trend-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: var(--blue-raw);
  background: rgba(55,138,221,0.10);
  border-radius: 6px;
  padding: 4px 8px;
  margin-bottom: 6px;
}
.trend-badge .ti { font-size: 12px; }

/* Range band */
.band-wrap { display: flex; flex-direction: column; gap: 7px; }
.band-track {
  height: 12px;
  background: var(--card-alt);
  border-radius: 6px;
  position: relative;
  overflow: visible;
}
.band-zone {
  position: absolute; top: 0; height: 100%;
  background: rgba(55,138,221,0.35);
  border-radius: 4px;
}
.band-zone-tick {
  position: absolute; top: -3px;
  width: 2px; height: calc(100% + 6px);
  background: rgba(55,138,221,0.6);
  border-radius: 1px;
}
.zone-tick-left  { transform: translateX(-1px); }
.zone-tick-right { transform: translateX(-1px); }
.band-pin {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--blue-raw);
  border: 2.5px solid var(--card-bg);
  box-shadow: 0 0 0 1.5px var(--blue-raw), 0 2px 6px rgba(55,138,221,0.4);
  z-index: 1;
}
.band-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted);
  padding: 0 2px;
}
.band-zone-label { color: var(--blue-raw); font-weight: 600; }

/* Sparkline */
.sparkline-section { display: flex; flex-direction: column; gap: 6px; }
.spark-meta {
  display: flex; align-items: center; justify-content: space-between;
}
.spark-title { font-size: 10px; color: var(--text-muted); font-weight: 500; }
.spark-range { display: flex; gap: 10px; }
.spark-stat  { font-size: 10px; font-weight: 600; color: var(--text-secondary); }

.sparkline-wrap {
  background: var(--card-alt);
  border-radius: 8px;
  overflow: hidden;
  padding: 6px 0 0;
}
.sparkline-svg { width: 100%; height: 52px; display: block; }

/* ══ CENTER: gauge ══ */
.gauge-card { padding: 22px 20px 18px; display: flex; flex-direction: column; align-items: center; }
.gauge-svg { width: 100%; max-width: 200px; height: auto; display: block; margin: 0 auto; }

.gauge-legend {
  display: flex; gap: 16px; margin-top: 2px;
  font-size: 10px; color: var(--text-muted);
}
.gauge-leg-item { display: flex; align-items: center; gap: 5px; }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Comfort breakdown — replaces redundant conditions list */
.comfort-breakdown {
  width: 100%;
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--card-alt);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.breakdown-icon { font-size: 14px; color: var(--blue-raw); flex-shrink: 0; margin-top: 1px; }
.breakdown-text { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

/* ══ RIGHT: config ══ */
.config-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.slider-group { display: flex; flex-direction: column; gap: 7px; }
.slider-header { display: flex; justify-content: space-between; align-items: center; }
.slider-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 500; color: var(--text-secondary);
}
.slider-label .ti { font-size: 12px; color: var(--blue-raw); }
.slider-val { font-size: 12px; font-weight: 700; color: var(--text); }

.slider {
  width: 100%;
  accent-color: var(--blue-raw);
  height: 4px;
  cursor: pointer;
}

.slider-wrap { position: relative; padding-bottom: 16px; }
.slider-marks { position: absolute; bottom: 0; left: 0; right: 0; pointer-events: none; }
.slider-mark {
  position: absolute; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.slider-mark::before {
  content: '';
  width: 1.5px; height: 5px;
  background: rgba(55,138,221,0.5);
  border-radius: 1px;
}
.mark-label {
  font-size: 9px; font-weight: 600;
  color: var(--blue-raw); opacity: 0.7;
  white-space: nowrap;
}

.slider-divider { height: 1px; background: var(--border); margin: 2px 0; }

.save-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%;
  padding: 10px;
  background: var(--blue-raw);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s;
  margin-top: 4px;
}
.save-btn:hover:not(:disabled) { opacity: 0.88; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 1000px) {
  .confort-layout { grid-template-columns: 1fr 1fr; }
  .right-col { grid-column: 1 / -1; }
}
@media (max-width: 700px) {
  .confort-layout { grid-template-columns: 1fr; }
}
</style>
