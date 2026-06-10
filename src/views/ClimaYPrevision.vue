<script setup>
import { computed } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import InsightBox  from '@/components/ui/InsightBox.vue'
import StatusDot   from '@/components/ui/StatusDot.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import LineChart   from '@/components/charts/LineChart.vue'
import DataCard    from '@/components/ui/DataCard.vue'

const env = useEnvironmentStore()

const forecastLabels = computed(() => env.forecast.map(f => f.hour))
const forecastChartData = computed(() => [
  {
    label: 'Temp. Exterior',
    data: env.forecast.map(f => f.temp),
    borderColor: '#EF9F27',
    backgroundColor: 'rgba(239,159,39,0.08)',
    fill: true,
    tension: 0.4,
    pointRadius: 3
  }
])

const current = computed(() => env.current || {})

function statusBadge(status) {
  return status === 'ok' ? 'Normal' : status === 'warning' ? 'Aviso' : 'Alerta'
}
</script>

<template>
  <div class="clima">

    <InsightBox
      text="Ola de calor prevista entre 14:00-17:00 (pico 36.2°C). Índice UV alto. El sistema ha activado protección solar automáticamente. Se espera descenso a 24°C tras las 22:00."
    />

    <!-- Current conditions -->
    <div class="conditions-grid">
      <div class="cond-card card">
        <div class="card-title">Temperatura exterior</div>
        <div class="cond-row">
          <span class="cond-value warning">{{ current.ext_temperature?.value ?? '—' }}</span>
          <span class="cond-unit">°C</span>
          <StatusDot :status="current.ext_temperature?.status || 'ok'" />
        </div>
        <span class="cond-status warning">{{ statusBadge(current.ext_temperature?.status) }}</span>
      </div>
      <div class="cond-card card">
        <div class="card-title">Humedad exterior</div>
        <div class="cond-row">
          <span class="cond-value">{{ current.ext_humidity?.value ?? '—' }}</span>
          <span class="cond-unit">%</span>
          <StatusDot :status="current.ext_humidity?.status || 'ok'" />
        </div>
        <span class="cond-status ok">Normal</span>
      </div>
      <div class="cond-card card">
        <div class="card-title">Velocidad del viento</div>
        <div class="cond-row">
          <span class="cond-value">{{ current.wind_kmh?.value ?? '—' }}</span>
          <span class="cond-unit">km/h</span>
          <StatusDot :status="current.wind_kmh?.status || 'ok'" />
        </div>
        <span class="cond-status ok">Normal</span>
      </div>
      <div class="cond-card card">
        <div class="card-title">Índice UV</div>
        <div class="cond-row">
          <span class="cond-value warning">{{ current.uv_index?.value ?? '—' }}</span>
          <span class="cond-unit"></span>
          <StatusDot :status="current.uv_index?.status || 'ok'" />
        </div>
        <span class="cond-status warning">Aviso</span>
      </div>
    </div>

    <!-- Forecast 12h -->
    <DataCard title="Previsión 12 horas">
      <!-- Scrollable hour cards -->
      <div class="forecast-scroll">
        <div v-for="hour in env.forecast" :key="hour.hour" class="forecast-hour">
          <div class="fh-hour">{{ hour.hour }}</div>
          <div class="fh-temp" :class="hour.temp > 35 ? 'danger' : hour.temp > 32 ? 'warning' : 'ok'">
            {{ hour.temp }}°
          </div>
          <div class="fh-feels">ST {{ hour.feels_like }}°</div>
        </div>
      </div>
      <!-- Line chart -->
      <div class="chart-wrap">
        <LineChart :datasets="forecastChartData" :labels="forecastLabels" :height="160" />
      </div>
    </DataCard>

    <!-- Bottom grid -->
    <div class="bottom-grid">
      <div class="card">
        <div class="card-title">Riesgo de incendio (FWI)</div>
        <div class="fwi-value warning">{{ current.fire_risk_fwi?.value ?? '—' }}</div>
        <ProgressBar
          :value="(current.fire_risk_fwi?.value / 50) * 100"
          color="var(--amber)"
          label="FWI actual"
          :right-label="`${current.fire_risk_fwi?.value} / 50`"
        />
        <div class="fwi-note">Umbral de aviso: 15 · Umbral de peligro: 30</div>
      </div>

      <div class="card">
        <div class="card-title">Balance hídrico</div>
        <div class="fwi-value" :class="current.water_balance_mm?.value < 0 ? 'warning' : 'ok'">
          {{ current.water_balance_mm?.value ?? '—' }} mm
        </div>
        <div class="small-note">Balance precipitaciones - evapotranspiración. Negativo = déficit.</div>
      </div>

      <div class="card">
        <div class="card-title">Intensidad CO₂ eléctrico</div>
        <div class="fwi-value ok">{{ current.co2_g_kwh?.value ?? '—' }}</div>
        <div class="co2-unit">g CO₂/kWh</div>
        <ProgressBar
          :value="(current.co2_g_kwh?.value / 400) * 100"
          color="var(--green)"
          label="Actual"
          :right-label="current.co2_g_kwh?.value + ' g/kWh'"
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
.clima { display: flex; flex-direction: column; gap: 14px; }

.conditions-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 10px;
}
.cond-card { display: flex; flex-direction: column; gap: 4px; }
.cond-row { display: flex; align-items: baseline; gap: 4px; margin-top: 2px; }
.cond-value { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.cond-value.warning { color: var(--amber); }
.cond-value.danger  { color: var(--red); }
.cond-unit { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.cond-status { font-size: 11px; font-weight: 500; }
.cond-status.ok      { color: var(--green); }
.cond-status.warning { color: var(--amber); }
.cond-status.danger  { color: var(--red); }

.forecast-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.forecast-hour {
  flex-shrink: 0;
  background: var(--card-alt);
  border-radius: 5px;
  padding: 8px 10px;
  text-align: center;
  min-width: 56px;
}
.fh-hour { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
.fh-temp { font-size: 16px; font-weight: 700; }
.fh-temp.ok      { color: var(--text); }
.fh-temp.warning { color: var(--amber); }
.fh-temp.danger  { color: var(--red); }
.fh-feels { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

.chart-wrap { margin-top: 4px; }

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 12px;
}
.fwi-value { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 6px 0; }
.fwi-value.warning { color: var(--amber); }
.fwi-value.ok      { color: var(--text); }
.fwi-note, .small-note, .co2-unit { font-size: 11px; color: var(--text-muted); margin: 4px 0; }
</style>
