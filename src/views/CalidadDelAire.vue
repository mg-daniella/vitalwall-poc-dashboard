<script setup>
import { computed } from 'vue'
import { useAirQualityStore } from '@/stores/airQuality'
import InsightBox   from '@/components/ui/InsightBox.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ErrorState   from '@/components/ui/ErrorState.vue'

const air = useAirQualityStore()

const aqiLevel = computed(() => {
  const v = air.aqi.value
  if (v == null) return { label: '—', sub: 'Sin datos', tier: 0 }
  if (v <= 25)   return { label: 'Muy buena',  sub: 'Sin restricciones recomendadas para actividad exterior.', tier: 1 }
  if (v <= 50)   return { label: 'Buena',      sub: 'Calidad del aire satisfactoria. Actividad exterior sin restricciones.', tier: 2 }
  if (v <= 75)   return { label: 'Moderada',   sub: 'Grupos sensibles pueden notar efectos leves. Actividad moderada recomendada.', tier: 3 }
  if (v <= 100)  return { label: 'Deficiente', sub: 'Puede afectar a personas sensibles. Limitar exposición prolongada al exterior.', tier: 4 }
  return           { label: 'Mala',       sub: 'Riesgo para la salud. Evitar actividades exteriores intensas.', tier: 5 }
})

// AQI gauge — arc from (10,65) to (110,65) with r=55, sweep clockwise (flag=1)
// Real center is below the chord: (60, 65 + sqrt(55²−50²))
const G_CX    = 60
const G_R     = 55
const G_CY    = 65 + Math.sqrt(G_R * G_R - 50 * 50)   // ≈ 87.91
const G_A0    = Math.atan2(65 - G_CY, 10  - G_CX)      // start angle (≈ −2.71 rad)
const G_A1    = Math.atan2(65 - G_CY, 110 - G_CX)      // end angle   (≈ −0.43 rad)
const G_SWEEP = G_A1 - G_A0                             // total sweep (positive = CW in SVG)

const aqiPct = computed(() => Math.min((air.aqi.value ?? 0) / 100, 1))

const aqiDot = computed(() => {
  if (air.aqi.value == null) return null
  const angle = G_A0 + aqiPct.value * G_SWEEP
  return {
    x: +(G_CX + G_R * Math.cos(angle)).toFixed(2),
    y: +(G_CY + G_R * Math.sin(angle)).toFixed(2),
  }
})

// Pollutant row data
const pollutants = computed(() => [
  { label: 'PM2.5', value: air.pm25.value, unit: 'µg/m³', status: air.pm25.status, limit: 25,  badge: 'Partículas finas' },
  { label: 'PM10',  value: air.pm10.value, unit: 'µg/m³', status: air.pm10.status, limit: 50,  badge: 'Partículas gruesas' },
  { label: 'CO',    value: air.co.value,   unit: 'mg/m³', status: air.co.status,   limit: 10,  badge: 'Monóxido de carbono' },
  { label: 'NO₂',  value: air.no2.value,  unit: 'µg/m³', status: air.no2.status,  limit: 200, badge: 'Dióxido de nitrógeno' },
  { label: 'O₃',   value: air.o3.value,   unit: 'µg/m³', status: air.o3.status,   limit: 120, badge: 'Ozono troposférico' },
  { label: 'AQI',  value: air.aqi.value,  unit: '',       status: air.aqi.status,  limit: 100, badge: 'Índice global' },
])

function barPct(value, limit) {
  if (value == null || !limit) return 0
  return Math.min((value / limit) * 100, 100)
}

function statusLabel(status) {
  if (status === 'ok')      return 'En límite'
  if (status === 'warning') return 'Próximo al límite'
  if (status === 'danger')  return 'Excedido'
  return '—'
}
</script>

<template>
  <div class="view-inner aire">

    <!-- InsightBox at the top, consistent with other pages -->
    <InsightBox
      text="Calidad del aire excelente. AQI 42 — muy por debajo del umbral de precaución (75). Todos los contaminantes dentro de los límites europeos. No se requiere filtrado adicional."
    />

    <!-- AQI hero -->
    <div class="aqi-hero card">
      <div class="section-label">Índice de calidad del aire · EAQI europeo</div>

      <div class="aqi-row">
        <!-- Gauge -->
        <div class="aqi-gauge-wrap">
          <svg viewBox="0 0 120 72" class="gauge-svg">
            <!-- Track -->
            <path d="M10,65 A55,55 0 0,1 110,65"
                  fill="none" stroke="var(--card-alt)" stroke-width="10" stroke-linecap="round"/>
            <!-- Value arc — blue only -->
            <path d="M10,65 A55,55 0 0,1 110,65"
                  fill="none" stroke="var(--blue-raw)" stroke-width="10" stroke-linecap="round"
                  :stroke-dasharray="`${aqiPct * 172} 172`"/>
            <!-- Endpoint dot — positioned on the real arc -->
            <circle v-if="aqiDot" :cx="aqiDot.x" :cy="aqiDot.y" r="9" fill="var(--blue-raw)" opacity="0.2"/>
            <circle v-if="aqiDot" :cx="aqiDot.x" :cy="aqiDot.y" r="6" fill="var(--blue-raw)"/>
            <circle v-if="aqiDot" :cx="aqiDot.x" :cy="aqiDot.y" r="2.5" fill="white"/>
            <!-- Score -->
            <text x="60" y="60" text-anchor="middle"
                  font-size="22" font-weight="700" fill="var(--text)" font-family="Inter">
              {{ air.aqi.value ?? '—' }}
            </text>
            <text x="60" y="72" text-anchor="middle"
                  font-size="8" fill="var(--text-muted)" font-family="Inter">
              / 100
            </text>
          </svg>
          <!-- Scale labels -->
          <div class="gauge-scale-labels">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <!-- Details -->
        <div class="aqi-details">
          <div class="aqi-level-row">
            <span class="aqi-level-value">{{ aqiLevel.label }}</span>
            <span class="aqi-tier-badge">Nivel {{ aqiLevel.tier }}/5</span>
          </div>
          <p class="aqi-desc">{{ aqiLevel.sub }}</p>

          <!-- Simple linear scale bar — blue only, pin marks position -->
          <div class="aqi-scale-wrap">
            <div class="aqi-scale-bar">
              <div class="aqi-scale-fill" :style="{ width: aqiPct * 100 + '%' }"></div>
              <div class="aqi-scale-pin" :style="{ left: aqiPct * 100 + '%' }"></div>
            </div>
            <div class="aqi-scale-ticks">
              <span>0 — Muy buena</span>
              <span>100 — Mala</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6 pollutant cards -->
    <div class="pollutants-grid">
      <template v-if="air.loading">
        <SkeletonCard v-for="n in 6" :key="n" />
      </template>
      <template v-else-if="air.error">
        <div class="error-span">
          <ErrorState
            :message="air.error.message"
            :status="air.error.status"
            :retry-exhausted="air.error.retryExhausted"
            :retrying="air.retrying"
            @retry="air.retry()"
          />
        </div>
      </template>
      <template v-else>
        <div v-for="p in pollutants" :key="p.label" class="card pollutant-card">
          <div class="poll-header">
            <div class="poll-label-group">
              <span class="section-label">{{ p.label }}</span>
              <span class="poll-badge">{{ p.badge }}</span>
            </div>
            <span class="poll-status-pill" :class="p.status === 'ok' ? 'pill-ok' : 'pill-warn'">
              {{ statusLabel(p.status) }}
            </span>
          </div>

          <div class="poll-value">
            {{ p.value ?? '—' }}<span class="poll-unit">{{ p.unit }}</span>
          </div>

          <!-- Progress bar — always blue -->
          <div class="poll-bar-wrap">
            <div class="poll-bar-track">
              <div class="poll-bar-fill" :style="{ width: barPct(p.value, p.limit) + '%' }"></div>
            </div>
            <div class="poll-bar-labels">
              <span>0</span>
              <span class="poll-limit-label">Límite: {{ p.limit }}{{ p.unit }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<style scoped>
.aire { display: flex; flex-direction: column; gap: 14px; }

/* Shared label style — matches other pages */
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-secondary);
}

/* ── AQI Hero ── */
.aqi-hero { padding: 20px 22px; }

.aqi-row {
  display: flex; align-items: center; gap: 28px;
  margin-top: 16px;
}

/* Gauge */
.aqi-gauge-wrap { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.gauge-svg { width: 140px; height: 90px; display: block; }
.gauge-scale-labels {
  display: flex; justify-content: space-between;
  width: 140px;
  font-size: 9px; color: var(--text-muted); font-weight: 500;
  padding: 0 4px;
}

/* Details */
.aqi-details { flex: 1; display: flex; flex-direction: column; gap: 10px; }

.aqi-level-row { display: flex; align-items: center; gap: 10px; }
.aqi-level-value { font-size: 24px; font-weight: 700; color: var(--text); line-height: 1; }
.aqi-tier-badge {
  font-size: 10px; font-weight: 700;
  color: var(--blue-raw); background: rgba(55,138,221,0.10);
  border: 1px solid rgba(55,138,221,0.2);
  border-radius: 20px; padding: 3px 9px;
}

.aqi-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.65; margin: 0; }

/* Scale bar — blue gradient, no traffic-light colors */
.aqi-scale-wrap { display: flex; flex-direction: column; gap: 5px; }
.aqi-scale-bar {
  height: 8px; border-radius: 4px;
  background: var(--card-alt);
  position: relative; overflow: visible;
}
.aqi-scale-fill {
  position: absolute; top: 0; left: 0; height: 100%;
  background: var(--blue-raw); opacity: 0.35;
  border-radius: 4px; transition: width 0.4s;
}
.aqi-scale-pin {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--blue-raw);
  border: 2.5px solid var(--card-bg);
  box-shadow: 0 0 0 1.5px var(--blue-raw), 0 2px 6px rgba(55,138,221,0.4);
  z-index: 1;
}
.aqi-scale-ticks {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted);
}

/* ── Pollutant grid ── */
.pollutants-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.error-span { grid-column: 1 / -1; }

.pollutant-card { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }

.poll-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.poll-label-group { display: flex; flex-direction: column; gap: 3px; }
.poll-badge { font-size: 10px; color: var(--text-muted); font-weight: 400; }

/* Status pill — blue only, no color-coding */
.poll-status-pill {
  flex-shrink: 0;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 3px 8px; border-radius: 20px;
  border: 1px solid transparent;
}
.pill-ok {
  background: rgba(55,138,221,0.08);
  border-color: rgba(55,138,221,0.2);
  color: var(--blue-raw);
}
.pill-warn {
  background: var(--card-alt);
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

/* Big value — neutral, no status color */
.poll-value {
  font-size: 32px; font-weight: 700; letter-spacing: -1px;
  color: var(--text); line-height: 1;
}
.poll-unit {
  font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-left: 3px;
}

/* Bar — always blue */
.poll-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.poll-bar-track {
  height: 6px; border-radius: 3px;
  background: var(--card-alt); overflow: hidden;
}
.poll-bar-fill {
  height: 100%; border-radius: 3px;
  background: var(--blue-raw); opacity: 0.75;
  transition: width 0.4s;
}
.poll-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted);
}
.poll-limit-label { color: var(--text-muted); font-weight: 500; }
</style>
