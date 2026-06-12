<script setup>
import { computed } from 'vue'
import { useAirQualityStore } from '@/stores/airQuality'
import MetricCard   from '@/components/ui/MetricCard.vue'
import InsightBox   from '@/components/ui/InsightBox.vue'
import ProgressBar  from '@/components/ui/ProgressBar.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ErrorState   from '@/components/ui/ErrorState.vue'

const air = useAirQualityStore()

const aqiLevel = computed(() => {
  const v = air.aqi.value
  if (v <= 25)  return { label: 'Muy buena', color: 'var(--green)' }
  if (v <= 50)  return { label: 'Buena',     color: 'var(--green)' }
  if (v <= 75)  return { label: 'Moderada',  color: 'var(--amber)' }
  if (v <= 100) return { label: 'Deficiente',color: 'var(--amber)' }
  return { label: 'Mala', color: 'var(--red)' }
})

const pollutants = computed(() => [
  { label: 'PM2.5', value: air.pm25.value, unit: 'µg/m³', status: air.pm25.status, limit: 25,  badge: 'Partículas finas' },
  { label: 'PM10',  value: air.pm10.value, unit: 'µg/m³', status: air.pm10.status, limit: 50,  badge: 'Partículas gruesas' },
  { label: 'CO',    value: air.co.value,   unit: 'mg/m³', status: air.co.status,   limit: 10,  badge: 'Monóxido de carbono' },
  { label: 'NO₂',  value: air.no2.value,  unit: 'µg/m³', status: air.no2.status,  limit: 200, badge: 'Dióxido de nitrógeno' },
  { label: 'O₃',   value: air.o3.value,   unit: 'µg/m³', status: air.o3.status,   limit: 120, badge: 'Ozono troposférico' },
  { label: 'AQI',  value: air.aqi.value,  unit: '',       status: air.aqi.status,  limit: 100, badge: 'Índice global' }
])
</script>

<template>
  <div class="view-inner aire">

    <!-- AQI hero -->
    <div class="aqi-hero card">
      <div class="card-title">Índice de calidad del aire (AQI europeo)</div>
      <div class="aqi-row">
        <div class="aqi-gauge">
          <svg viewBox="0 0 120 70" class="gauge-svg">
            <path d="M10,65 A55,55 0 0,1 110,65" fill="none" stroke="var(--card-alt)" stroke-width="10" stroke-linecap="round"/>
            <path
              d="M10,65 A55,55 0 0,1 110,65"
              fill="none"
              :stroke="aqiLevel.color"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="`${(air.aqi.value / 100) * 172} 172`"
            />
            <text x="60" y="60" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)" font-family="Inter">
              {{ air.aqi.value ?? '—' }}
            </text>
          </svg>
        </div>
        <div class="aqi-details">
          <div class="aqi-level" :style="{ color: aqiLevel.color }">{{ aqiLevel.label }}</div>
          <div class="aqi-desc">Calidad del aire {{ aqiLevel.label.toLowerCase() }} según el Índice Europeo de Calidad del Aire (EAQI). Sin restricciones recomendadas para actividad exterior.</div>
          <div class="aqi-scale">
            <span>0</span>
            <div class="scale-bar">
              <div class="scale-indicator" :style="{ left: air.aqi.value + '%' }"></div>
            </div>
            <span>100+</span>
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
          <div class="card-title">{{ p.label }}</div>
          <div class="pollutant-value" :class="p.status">
            {{ p.value ?? '—' }}<span class="pollutant-unit">{{ p.unit }}</span>
          </div>
          <div class="pollutant-badge">{{ p.badge }}</div>
          <ProgressBar
            v-if="p.limit"
            :value="(p.value / p.limit) * 100"
            :color="p.status === 'ok' ? 'var(--green)' : p.status === 'warning' ? 'var(--amber)' : 'var(--red)'"
            :right-label="`Límite: ${p.limit}${p.unit}`"
          />
        </div>
      </template>
    </div>

    <InsightBox
      text="Calidad del aire excelente. AQI 42 — muy por debajo del umbral de precaución (75). Todos los contaminantes dentro de los límites europeos. No se requiere filtrado adicional."
    />

  </div>
</template>

<style scoped>
.aire { display: flex; flex-direction: column; gap: 14px; }

.aqi-hero {}
.aqi-row { display: flex; align-items: center; gap: 24px; margin-top: 8px; }
.aqi-gauge { flex-shrink: 0; }
.gauge-svg { width: 140px; height: 85px; }
.aqi-details { flex: 1; }
.aqi-level { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.aqi-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 10px; }
.aqi-scale { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text-muted); }
.scale-bar {
  flex: 1; height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, var(--green), var(--amber), var(--red));
  position: relative;
}
.scale-indicator {
  position: absolute; top: -3px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--text);
  border: 2px solid var(--card-bg);
  transform: translateX(-50%);
}

.pollutants-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.pollutant-card { display: flex; flex-direction: column; gap: 4px; }
.pollutant-value { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); margin: 4px 0; }
.pollutant-value.warning { color: var(--amber); }
.pollutant-value.danger  { color: var(--red); }
.pollutant-unit { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-left: 2px; }
.pollutant-badge { font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
.error-span { grid-column: 1 / -1; }
</style>
