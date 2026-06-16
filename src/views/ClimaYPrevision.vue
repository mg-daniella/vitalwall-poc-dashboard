<script setup>
import { computed } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import InsightBox   from '@/components/ui/InsightBox.vue'
import LineChart    from '@/components/charts/LineChart.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const env = useEnvironmentStore()

const current  = computed(() => env.current  || {})
const forecast = computed(() => env.forecast || [])

function val(key)  { return current.value[key]?.value ?? '—' }
function stat(key) { return current.value[key]?.status ?? 'ok' }

function hourIcon(hour) {
  const h = parseInt(String(hour ?? '12').split(':')[0])
  return h >= 6 && h < 20 ? 'ti-sun' : 'ti-moon-stars'
}

// 3 condition cards — UV Index removed
const condCards = computed(() => [
  { key: 'ext_temperature', label: 'Temperatura exterior', unit: '°C',   icon: 'ti-thermometer' },
  { key: 'ext_humidity',    label: 'Humedad exterior',     unit: '%',    icon: 'ti-droplet' },
  { key: 'wind_kmh',        label: 'Viento',               unit: 'km/h', icon: 'ti-wind' },
].map(c => ({ ...c, value: val(c.key), status: stat(c.key) })))

function statusLabel(s) {
  if (s === 'ok')      return 'Normal'
  if (s === 'warning') return 'Fuera de rango'
  return 'Alerta'
}

// Chart — blue only
const forecastLabels = computed(() => forecast.value.map(f => f.hour || ''))
const forecastDatasets = computed(() => [{
  label: 'Temp. Exterior',
  data: forecast.value.map(f => f.temp),
  borderColor: 'rgba(55,138,221,1)',
  backgroundColor: 'rgba(55,138,221,0.08)',
  fill: true, tension: 0.4, pointRadius: 3
}])

// Temp range bar for forecast (min/max across all hours)
const forecastTemps = computed(() => forecast.value.map(f => f.temp).filter(t => t != null))
const fcTempMin = computed(() => forecastTemps.value.length ? Math.min(...forecastTemps.value) : 0)
const fcTempMax = computed(() => forecastTemps.value.length ? Math.max(...forecastTemps.value) : 40)

function tempBarPct(t) {
  const range = fcTempMax.value - fcTempMin.value || 1
  return Math.round(((t - fcTempMin.value) / range) * 100)
}

// Bottom metrics
const fwiPct  = computed(() => Math.min(((current.value.fire_risk_fwi?.value  ?? 0) / 50)  * 100, 100))
const co2Pct  = computed(() => Math.min(((current.value.co2_g_kwh?.value      ?? 0) / 400) * 100, 100))
const waterPct = computed(() => Math.max(0, Math.min(50 + (current.value.water_balance_mm?.value ?? 0), 100)))
</script>

<template>
  <div class="view-inner clima">

    <!-- Error banner -->
    <div v-if="env.error" class="env-error">
      <i class="ti ti-alert-circle" aria-hidden="true"></i>
      <span>Error al cargar datos climáticos: {{ env.error.message }}</span>
      <button @click="env.retry()" class="env-retry">Reintentar</button>
    </div>

    <!-- InsightBox -->
    <InsightBox
      text="Temperatura exterior alcanzará pico de 36.2°C a las 15h. Sistema ha activado absorción PCM en capa 3 y tiene reflectividad máxima en espera. Interior previsto 25–27°C sin climatización adicional."
    />

    <!-- 3 current condition cards -->
    <div class="conditions-grid">
      <template v-if="env.loading">
        <SkeletonCard v-for="n in 3" :key="n" />
      </template>
      <template v-else>
        <div v-for="card in condCards" :key="card.key" class="card cond-card">
          <div class="cond-top">
            <span class="section-label">{{ card.label }}</span>
            <span class="cond-status-pill" :class="card.status !== 'ok' ? 'pill-warn' : 'pill-ok'">
              {{ statusLabel(card.status) }}
            </span>
          </div>
          <div class="cond-value-row">
            <i :class="`ti ${card.icon} cond-icon`" aria-hidden="true"></i>
            <div class="cond-value">
              {{ card.value }}<span class="cond-unit">{{ card.unit }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Forecast 12h -->
    <div class="card forecast-card-wrap">
      <div class="forecast-hd">
        <div class="section-label">Previsión 12 horas</div>
        <span class="forecast-hint">Temperatura exterior · °C</span>
      </div>

      <div v-if="!forecast.length" class="empty-state">
        <i class="ti ti-cloud-off empty-icon" aria-hidden="true"></i>
        <span class="empty-title">Sin datos de previsión</span>
        <span class="empty-sub">Los datos de previsión no están disponibles en este momento.</span>
      </div>

      <template v-else>
        <!-- Hour tiles -->
        <div class="forecast-scroll">
          <div v-for="f in forecast" :key="f.hour" class="fc-tile">
            <div class="fc-hour">{{ f.hour }}</div>
            <i :class="`ti ${hourIcon(f.hour)} fc-icon`" aria-hidden="true"></i>
            <div class="fc-temp">{{ f.temp != null ? f.temp + '°' : '—' }}</div>
            <!-- Mini temp bar relative to forecast range -->
            <div class="fc-bar-track">
              <div class="fc-bar-fill" :style="{ width: tempBarPct(f.temp) + '%' }"></div>
            </div>
            <div class="fc-wind" v-if="f.wind_kmh != null">
              <i class="ti ti-wind"></i> {{ f.wind_kmh }}
            </div>
            <div class="fc-rain" v-if="f.precipitation_prob != null">
              <i class="ti ti-droplet"></i> {{ f.precipitation_prob }}%
            </div>
          </div>
        </div>

        <!-- Line chart -->
        <div class="forecast-chart">
          <LineChart :datasets="forecastDatasets" :labels="forecastLabels" :height="140" />
        </div>
      </template>
    </div>

    <!-- Bottom 3-col grid -->
    <div class="bottom-grid">

      <!-- FWI -->
      <div class="card metric-card">
        <div class="section-label">Riesgo de Incendio · FWI</div>
        <div class="metric-value">
          {{ val('fire_risk_fwi') }}<span class="metric-unit">/ 50</span>
        </div>
        <div class="metric-bar-track">
          <div class="metric-bar-fill" :style="{ width: fwiPct + '%' }"></div>
          <div class="metric-bar-tick" style="left: 30%"><span class="tick-label">15</span></div>
          <div class="metric-bar-tick" style="left: 60%"><span class="tick-label">30</span></div>
        </div>
        <div class="metric-ticks-row">
          <span>0 — Sin riesgo</span>
          <span>50 — Extremo</span>
        </div>
        <div class="metric-note">Umbral de aviso: 15 · Peligro: 30</div>
      </div>

      <!-- Water balance -->
      <div class="card metric-card">
        <div class="section-label">Balance hídrico</div>
        <div class="metric-value">
          {{ val('water_balance_mm') }}<span class="metric-unit">mm</span>
        </div>
        <div class="metric-bar-track">
          <div class="metric-bar-fill" :style="{ width: waterPct + '%' }"></div>
          <div class="metric-bar-tick" style="left: 50%"><span class="tick-label">0</span></div>
        </div>
        <div class="metric-ticks-row">
          <span>Déficit</span>
          <span>Superávit</span>
        </div>
        <div class="metric-note">Precipitaciones − evapotranspiración. Negativo = déficit.</div>
      </div>

      <!-- CO₂ intensity -->
      <div class="card metric-card">
        <div class="section-label">CO₂ Intensidad eléctrica</div>
        <div class="metric-value">
          {{ val('co2_g_kwh') }}<span class="metric-unit">g/kWh</span>
        </div>
        <div class="metric-bar-track">
          <div class="metric-bar-fill" :style="{ width: co2Pct + '%' }"></div>
          <div class="metric-bar-tick" style="left: 100%"><span class="tick-label">400</span></div>
        </div>
        <div class="metric-ticks-row">
          <span>0</span>
          <span>Límite: 400 g/kWh</span>
        </div>
        <div class="metric-note">Fuente: REData — mix eléctrico nacional en tiempo real.</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.clima { display: flex; flex-direction: column; gap: 14px; }

/* Shared label */
.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-secondary);
}

/* ── Error banner ── */
.env-error {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px;
  background: var(--card-alt);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-card);
  font-size: 12px; color: var(--text-secondary);
}
.env-error .ti { font-size: 15px; color: var(--text-muted); flex-shrink: 0; }
.env-retry {
  margin-left: auto;
  background: var(--blue-raw); color: #fff;
  border: none; border-radius: 5px;
  padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
  flex-shrink: 0;
}

/* ── Condition cards ── */
.conditions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.cond-card { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

.cond-top { display: flex; align-items: center; justify-content: space-between; }
.cond-status-pill {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 3px 8px; border-radius: 20px; border: 1px solid transparent;
}
.pill-ok   { background: rgba(55,138,221,0.08); border-color: rgba(55,138,221,0.2); color: var(--blue-raw); }
.pill-warn { background: var(--card-alt); border-color: var(--border-strong); color: var(--text-secondary); }

.cond-value-row { display: flex; align-items: flex-end; gap: 10px; }
.cond-icon { font-size: 22px; color: var(--blue-raw); opacity: 0.7; margin-bottom: 4px; }
.cond-value { font-size: 44px; font-weight: 700; letter-spacing: -2px; color: var(--text); line-height: 1; }
.cond-unit  { font-size: 16px; font-weight: 400; color: var(--text-secondary); margin-left: 3px; }

/* ── Forecast card ── */
.forecast-card-wrap { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.forecast-hd { display: flex; align-items: center; justify-content: space-between; }
.forecast-hint { font-size: 10px; color: var(--text-muted); }

/* Hour tiles */
.forecast-scroll {
  display: flex; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; scrollbar-width: thin;
}
.fc-tile {
  flex-shrink: 0; min-width: 64px;
  background: var(--card-alt);
  border: 1px solid var(--border);
  border-radius: 10px; padding: 11px 8px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.fc-hour { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.fc-icon { font-size: 18px; color: var(--blue-raw); opacity: 0.8; }
.fc-temp { font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; }

.fc-bar-track {
  width: 100%; height: 4px; background: var(--border);
  border-radius: 2px; overflow: hidden;
}
.fc-bar-fill  { height: 100%; background: var(--blue-raw); opacity: 0.5; border-radius: 2px; }

.fc-wind, .fc-rain {
  font-size: 9px; color: var(--text-muted); font-weight: 500;
  display: flex; align-items: center; gap: 2px;
}
.fc-wind .ti, .fc-rain .ti { font-size: 9px; }

/* Chart */
.forecast-chart { margin-top: 4px; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 32px; text-align: center;
}
.empty-icon  { font-size: 28px; color: var(--border-strong); }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.empty-sub   { font-size: 12px; color: var(--text-muted); max-width: 280px; line-height: 1.6; }

/* ── Bottom metric cards ── */
.bottom-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.metric-card { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }

.metric-value {
  font-size: 40px; font-weight: 700; letter-spacing: -2px;
  color: var(--text); line-height: 1;
}
.metric-unit { font-size: 14px; font-weight: 400; color: var(--text-secondary); margin-left: 4px; }

/* Bar — blue only */
.metric-bar-track {
  height: 8px; background: var(--card-alt);
  border-radius: 4px; position: relative; overflow: visible;
}
.metric-bar-fill {
  height: 100%; background: var(--blue-raw); opacity: 0.75;
  border-radius: 4px; transition: width 0.4s;
}
.metric-bar-tick {
  position: absolute; top: -3px;
  width: 1.5px; height: calc(100% + 6px);
  background: rgba(55,138,221,0.4);
  transform: translateX(-50%);
}
.tick-label {
  position: absolute; top: calc(100% + 3px); left: 50%;
  transform: translateX(-50%);
  font-size: 8px; color: var(--text-muted); font-weight: 600;
  white-space: nowrap;
}
.metric-ticks-row {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted); margin-top: -4px;
}
.metric-note { font-size: 10px; color: var(--text-muted); line-height: 1.55; }
</style>
