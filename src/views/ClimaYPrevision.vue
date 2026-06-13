<script setup>
import { computed } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import InsightBox   from '@/components/ui/InsightBox.vue'
import StatusDot    from '@/components/ui/StatusDot.vue'
import ProgressBar  from '@/components/ui/ProgressBar.vue'
import LineChart    from '@/components/charts/LineChart.vue'
import DataCard     from '@/components/ui/DataCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const env = useEnvironmentStore()

onMounted(() => {})

// Safe accessors — never throw if store is still loading
const current  = computed(() => env.current  || {})
const forecast = computed(() => env.forecast || [])

// Helpers
function val(key)  { return current.value[key]?.value ?? '—' }
function stat(key) { return current.value[key]?.status ?? 'ok' }
function stLabel(s){ return s === 'ok' ? 'Normal' : s === 'warning' ? 'Aviso' : 'Alerta' }

function hourIcon(hour) {
  const h = parseInt(String(hour ?? '12').split(':')[0])
  return h >= 6 && h < 20 ? '☀' : '🌙'
}
function tempColor(t) {
  if (t == null) return 'var(--text-muted)'
  if (t > 35) return 'var(--red)'
  if (t > 30) return 'var(--amber)'
  return 'var(--text)'
}

// Card descriptors for the 4 condition boxes
const condCards = computed(() => [
  { key: 'ext_temperature', label: 'Temperatura exterior', unit: '°C'  },
  { key: 'ext_humidity',    label: 'Humedad exterior',     unit: '%'   },
  { key: 'wind_kmh',        label: 'Viento',               unit: 'km/h'},
  { key: 'uv_index',        label: 'Índice UV',            unit: ''    }
].map(c => ({ ...c, value: val(c.key), status: stat(c.key) })))

// Chart
const forecastLabels = computed(() => forecast.value.map(f => f.hour || ''))
const forecastDatasets = computed(() => [{
  label: 'Temp. Exterior',
  data: forecast.value.map(f => f.temp),
  borderColor: '#EF9F27',
  backgroundColor: 'rgba(239,159,39,0.08)',
  fill: true, tension: 0.4, pointRadius: 3
}])

const fwiPct = computed(() => Math.min(((current.value.fire_risk_fwi?.value ?? 0) / 50) * 100, 100))
</script>

<template>
  <div class="view-inner">

    <!-- Error banner (shown when API fails) -->
    <div v-if="env.error" class="env-error">
      ⚠ Error al cargar datos climáticos: {{ env.error.message }}
      <button @click="env.retry()" class="env-retry">Reintentar</button>
    </div>

    <!-- AI strip -->
    <InsightBox
      text="Temperatura exterior alcanzará pico de 36.2°C a las 15h. Sistema ha activado absorción PCM en capa 3 y tiene reflectividad máxima en espera. Interior previsto 25–27°C sin climatización adicional."
    />

    <!-- 4 current condition cards -->
    <div class="conditions-grid">
      <template v-if="env.loading">
        <SkeletonCard v-for="n in 4" :key="n" height="100px" />
      </template>
      <template v-else>
        <div v-for="card in condCards" :key="card.key" class="cond-card">
          <div class="cond-label">{{ card.label }}</div>
          <div class="cond-value" :class="card.status">
            {{ card.value }}<span class="cond-unit">{{ card.unit }}</span>
          </div>
          <div class="cond-footer">
            <StatusDot :status="card.status" />
            <span class="cond-status" :class="card.status">{{ stLabel(card.status) }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Forecast 12h -->
    <DataCard title="Previsión 12 horas">
      <div v-if="!forecast.length" class="empty-forecast">Sin datos de previsión disponibles</div>
      <template v-else>
        <div class="forecast-scroll">
          <div v-for="f in forecast" :key="f.hour" class="forecast-card">
            <div class="fc-hour">{{ f.hour }}</div>
            <div class="fc-icon">{{ hourIcon(f.hour) }}</div>
            <div class="fc-temp" :style="{ color: tempColor(f.temp) }">{{ f.temp != null ? f.temp + '°' : '—' }}</div>
            <div class="fc-wind">{{ f.wind_kmh != null ? f.wind_kmh + ' km/h' : '' }}</div>
            <div class="fc-rain" v-if="f.precipitation_prob != null">{{ f.precipitation_prob }}%</div>
          </div>
        </div>
        <div style="margin-top:14px;">
          <LineChart :datasets="forecastDatasets" :labels="forecastLabels" :height="160" />
        </div>
      </template>
    </DataCard>

    <!-- Bottom 3-col grid -->
    <div class="bottom-grid">

      <div class="card-plain">
        <div class="card-plain-title">Riesgo de Incendio (FWI)</div>
        <div class="card-big" :class="stat('fire_risk_fwi')">{{ val('fire_risk_fwi') }}</div>
        <ProgressBar
          :value="fwiPct"
          :color="stat('fire_risk_fwi') === 'danger' ? 'var(--red)' : stat('fire_risk_fwi') === 'warning' ? 'var(--amber)' : 'var(--green)'"
          :right-label="`${val('fire_risk_fwi')} / 50`"
        />
        <div class="card-note">Umbral aviso: 15 · Peligro: 30</div>
      </div>

      <div class="card-plain">
        <div class="card-plain-title">Balance hídrico</div>
        <div class="card-big" :class="stat('water_balance_mm')">
          {{ val('water_balance_mm') }}<span class="card-unit">mm</span>
        </div>
        <ProgressBar
          :value="Math.max(0, Math.min(50 + (current.water_balance_mm?.value ?? 0), 100))"
          color="var(--blue-raw)"
          :right-label="val('water_balance_mm') + ' mm'"
        />
        <div class="card-note">Precipitaciones − evapotranspiración. Negativo = déficit.</div>
      </div>

      <div class="card-plain">
        <div class="card-plain-title">CO₂ intensidad eléctrica</div>
        <div class="card-big">{{ val('co2_g_kwh') }}<span class="card-unit">g/kWh</span></div>
        <ProgressBar
          :value="Math.min(((current.co2_g_kwh?.value ?? 0) / 400) * 100, 100)"
          color="var(--green)"
          right-label="Límite: 400 g/kWh"
        />
        <div class="card-note">Fuente: REData — mix eléctrico nacional en tiempo real.</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.conditions-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.cond-card {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 6px; padding: 14px 16px;
}
.cond-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;
}
.cond-value { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); line-height: 1; }
.cond-value.warning { color: var(--amber); }
.cond-value.danger  { color: var(--red); }
.cond-unit { font-size: 13px; font-weight: 400; color: var(--text-secondary); margin-left: 2px; }
.cond-footer { display: flex; align-items: center; gap: 5px; margin-top: 8px; }
.cond-status { font-size: 11px; font-weight: 500; }
.cond-status.ok      { color: var(--green); }
.cond-status.warning { color: var(--amber); }
.cond-status.danger  { color: var(--red); }

.forecast-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.forecast-card {
  flex-shrink: 0; min-width: 60px;
  background: var(--card-alt); border-radius: 5px; padding: 9px 8px; text-align: center;
}
.fc-hour { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
.fc-icon { font-size: 16px; margin-bottom: 3px; }
.fc-temp { font-size: 16px; font-weight: 700; }
.fc-wind { font-size: 10px; color: var(--text-muted); margin-top: 3px; }
.fc-rain { font-size: 10px; color: var(--blue-raw); }

.empty-forecast { padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; }

.bottom-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.card-plain {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 8px;
}
.card-plain-title {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--text-muted);
}
.card-big { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.card-big.warning { color: var(--amber); }
.card-big.danger  { color: var(--red); }
.card-unit { font-size: 13px; font-weight: 400; color: var(--text-secondary); margin-left: 2px; }
.card-note { font-size: 10px; color: var(--text-muted); line-height: 1.5; }

.env-error {
  background: rgba(226,75,74,0.08); border: 1px solid rgba(226,75,74,0.2);
  border-radius: 5px; padding: 10px 14px; font-size: 12px; color: var(--red);
  display: flex; align-items: center; gap: 12px;
}
.env-retry {
  background: var(--red); color: #fff; border: none; border-radius: 3px;
  padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;
}
</style>
