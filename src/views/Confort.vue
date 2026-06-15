<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSensorsStore } from '@/stores/sensors'
import { useMetricsStore } from '@/stores/metrics'
import { useApi }          from '@/composables/useApi'
import InsightBox  from '@/components/ui/InsightBox.vue'
import StatusDot   from '@/components/ui/StatusDot.vue'
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
const score       = computed(() => metrics.comfort_score?.value ?? null)
const tempInRange = computed(() => tempVal.value != null && tempVal.value >= tempMin.value && tempVal.value <= tempMax.value)
const humInRange  = computed(() => humVal.value  != null && humVal.value  >= humMin.value  && humVal.value  <= humMax.value)

// ── Radial gauge ──
// Arc: r=70, cx=100, cy=100. Full arc = 220° (from 160° to 20° going clockwise through 0°)
const GAUGE_R  = 70
const GAUGE_CX = 100
const GAUGE_CY = 105
const ARC_DEG  = 220 // total sweep

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

const GAUGE_START = 160 // degrees
const GAUGE_END   = 20  // wraps through 360

const gaugeTrackPath = computed(() => describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, GAUGE_START, GAUGE_START + ARC_DEG))

const gaugeValuePath = computed(() => {
  if (score.value == null) return ''
  const pct  = Math.min(Math.max(score.value / 100, 0), 1)
  const sweep = pct * ARC_DEG
  if (sweep < 1) return ''
  return describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, GAUGE_START, GAUGE_START + sweep)
})

const gaugeDotPos = computed(() => {
  if (score.value == null) return null
  const pct   = Math.min(Math.max(score.value / 100, 0), 1)
  const angle = GAUGE_START + pct * ARC_DEG
  return polarToXY(GAUGE_CX, GAUGE_CY, GAUGE_R, angle)
})

// ── Range band: position of current value as % across full band track ──
// Track represents [absoluteMin .. absoluteMax]. Zone band [min..max] is highlighted.
function bandPct(val, absMin, absMax) {
  if (val == null) return null
  return Math.min(Math.max(((val - absMin) / (absMax - absMin)) * 100, 0), 100)
}
function zonePct(v, absMin, absMax) {
  return Math.min(Math.max(((v - absMin) / (absMax - absMin)) * 100, 0), 100)
}

// Synthetic sparkline data (last 12 "readings") based on current value ± noise
function mockSparkline(base, count = 12) {
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

function sparkPath(pts, w, h) {
  if (!pts.length) return ''
  const mn = Math.min(...pts), mx = Math.max(...pts)
  const range = mx - mn || 1
  const xStep = w / (pts.length - 1)
  return pts.map((v, i) => {
    const x = i * xStep
    const y = h - ((v - mn) / range) * h
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}
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
          <div class="reading-header">
            <div>
              <div class="card-label">Temperatura</div>
              <div class="reading-big">
                {{ tempVal ?? '—' }}<span class="reading-unit">°C</span>
              </div>
            </div>
            <div class="reading-status">
              <StatusDot :status="tempInRange ? 'ok' : 'warning'" />
              <span class="status-text" :class="tempInRange ? 'in-range' : 'out-range'">
                {{ tempInRange ? 'En rango' : 'Fuera de rango' }}
              </span>
            </div>
          </div>

          <!-- Range band -->
          <div class="band-wrap">
            <div class="band-track">
              <!-- comfort zone highlight -->
              <div class="band-zone"
                :style="{
                  left:  zonePct(tempMin, 14, 32) + '%',
                  width: (zonePct(tempMax, 14, 32) - zonePct(tempMin, 14, 32)) + '%'
                }"
              ></div>
              <!-- current value pin -->
              <div v-if="tempVal != null" class="band-pin"
                :style="{ left: bandPct(tempVal, 14, 32) + '%' }"
              ></div>
            </div>
            <div class="band-labels">
              <span>14°</span>
              <span>{{ tempMin }}° — {{ tempMax }}° rango</span>
              <span>32°</span>
            </div>
          </div>

          <!-- Sparkline -->
          <div class="sparkline-wrap">
            <svg class="sparkline-svg" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path :d="sparkPath(tempSparkline, 120, 28)" class="spark-line" fill="none"/>
            </svg>
            <span class="spark-label">Últimas 12 lecturas</span>
          </div>
        </div>

        <!-- Humedad -->
        <div class="card reading-card">
          <div class="reading-header">
            <div>
              <div class="card-label">Humedad</div>
              <div class="reading-big">
                {{ humVal ?? '—' }}<span class="reading-unit">%</span>
              </div>
            </div>
            <div class="reading-status">
              <StatusDot :status="humInRange ? 'ok' : 'warning'" />
              <span class="status-text" :class="humInRange ? 'in-range' : 'out-range'">
                {{ humInRange ? 'En rango' : 'Fuera de rango' }}
              </span>
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
              <div v-if="humVal != null" class="band-pin"
                :style="{ left: bandPct(humVal, 20, 80) + '%' }"
              ></div>
            </div>
            <div class="band-labels">
              <span>20%</span>
              <span>{{ humMin }}% — {{ humMax }}% rango</span>
              <span>80%</span>
            </div>
          </div>

          <!-- Sparkline -->
          <div class="sparkline-wrap">
            <svg class="sparkline-svg" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path :d="sparkPath(humSparkline, 120, 28)" class="spark-line" fill="none"/>
            </svg>
            <span class="spark-label">Últimas 12 lecturas</span>
          </div>
        </div>

      </div>

      <!-- ══ CENTER: comfort score gauge ══ -->
      <div class="center-col">
        <div class="card gauge-card">
          <div class="card-label center">Puntuación de confort</div>

          <svg viewBox="0 0 200 140" class="gauge-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Track -->
            <path :d="gaugeTrackPath" fill="none" stroke="var(--card-alt)" stroke-width="10" stroke-linecap="round"/>
            <!-- Value arc -->
            <path v-if="score != null" :d="gaugeValuePath" fill="none" stroke="var(--blue-raw)" stroke-width="10" stroke-linecap="round"/>
            <!-- Dot -->
            <g v-if="gaugeDotPos">
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="9" fill="var(--blue-raw)" opacity="0.2"/>
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="6" fill="var(--blue-raw)"/>
              <circle :cx="gaugeDotPos.x" :cy="gaugeDotPos.y" r="2.5" fill="white"/>
            </g>
            <!-- Score number -->
            <text :x="GAUGE_CX" :y="GAUGE_CY + 4" text-anchor="middle"
                  font-size="28" font-weight="700" fill="var(--text)" font-family="Inter">
              {{ score ?? '—' }}
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

          <!-- Conditions summary -->
          <div class="conditions-list">
            <div class="cond-row">
              <StatusDot :status="tempInRange ? 'ok' : 'warning'" />
              <span class="cond-label">Temperatura</span>
              <span class="cond-val">{{ tempVal != null ? tempVal + ' °C' : '—' }}</span>
            </div>
            <div class="cond-row">
              <StatusDot :status="humInRange ? 'ok' : 'warning'" />
              <span class="cond-label">Humedad</span>
              <span class="cond-val">{{ humVal != null ? humVal + ' %' : '—' }}</span>
            </div>
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
          <input type="range" v-model.number="humMin" min="20" max="50" step="1" class="slider" />
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">
              <i class="ti ti-droplet" aria-hidden="true"></i>
              Humedad máxima
            </span>
            <span class="slider-val">{{ humMax }}%</span>
          </div>
          <input type="range" v-model.number="humMax" min="40" max="80" step="1" class="slider" />
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
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 12px;
}
.card-label.center { text-align: center; }

/* ══ LEFT ══ */
.left-col { display: flex; flex-direction: column; gap: 12px; }

.reading-card { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

.reading-header { display: flex; justify-content: space-between; align-items: flex-start; }
.reading-big { font-size: 48px; font-weight: 700; letter-spacing: -2px; color: var(--text); line-height: 1; margin-top: 4px; }
.reading-unit { font-size: 18px; color: var(--text-secondary); margin-left: 2px; }

.reading-status { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; padding-top: 4px; }
.status-text { font-size: 11px; font-weight: 600; }
.in-range  { color: var(--blue-raw); }
.out-range { color: var(--text-muted); }

/* Range band */
.band-wrap { display: flex; flex-direction: column; gap: 6px; }
.band-track {
  height: 8px;
  background: var(--card-alt);
  border-radius: 4px;
  position: relative;
  overflow: visible;
}
.band-zone {
  position: absolute; top: 0; height: 100%;
  background: rgba(55,138,221,0.18);
  border-left: 2px solid rgba(55,138,221,0.5);
  border-right: 2px solid rgba(55,138,221,0.5);
  border-radius: 2px;
}
.band-pin {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--blue-raw);
  border: 2.5px solid var(--card-bg);
  box-shadow: 0 0 0 1.5px var(--blue-raw);
  z-index: 1;
}
.band-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted);
  padding: 0 2px;
}
.band-labels span:nth-child(2) { color: var(--blue-raw); font-weight: 600; }

/* Sparkline */
.sparkline-wrap { display: flex; flex-direction: column; gap: 4px; }
.sparkline-svg { width: 100%; height: 28px; display: block; }
.spark-line { stroke: var(--blue-raw); stroke-width: 1.5; opacity: 0.7; }
.spark-label { font-size: 9px; color: var(--text-muted); }

/* ══ CENTER: gauge ══ */
.center-col {}
.gauge-card { padding: 22px 20px 18px; display: flex; flex-direction: column; align-items: center; }
.gauge-svg { width: 100%; max-width: 200px; height: auto; display: block; margin: 0 auto; }

.gauge-legend {
  display: flex; gap: 16px; margin-top: 2px;
  font-size: 10px; color: var(--text-muted);
}
.gauge-leg-item { display: flex; align-items: center; gap: 5px; }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.conditions-list {
  width: 100%;
  display: flex; flex-direction: column; gap: 0;
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
.cond-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
}
.cond-row:last-child { border-bottom: none; }
.cond-label { flex: 1; color: var(--text-secondary); font-weight: 500; }
.cond-val { font-weight: 700; color: var(--text); }

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
