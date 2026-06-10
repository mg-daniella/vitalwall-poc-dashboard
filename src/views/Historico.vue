<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import LineChart  from '@/components/charts/LineChart.vue'
import DataCard   from '@/components/ui/DataCard.vue'
import ErrorState from '@/components/ui/ErrorState.vue'

const api     = useApi()
const period  = ref('24h')
const history = ref({ temperature: [], humidity: [], water_level: [] })
const loading = ref(false)
const fetchError = ref(null)

const periods = [
  { id: '1h',  label: 'Última hora' },
  { id: '24h', label: '24 horas' },
  { id: '7d',  label: '7 días' }
]

async function loadHistory() {
  loading.value    = true
  fetchError.value = null
  try {
    history.value = await api.getSensorsHistory(period.value)
  } catch (err) {
    fetchError.value = {
      message:        err.message || 'Error al cargar histórico',
      status:         err.status  || null,
      retryExhausted: err.retryExhausted || false
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
watch(period, loadHistory)

function stats(arr) {
  if (!arr?.length) return { min: '—', max: '—', avg: '—', range: '—' }
  const vals = arr.map(p => p.v)
  const min  = Math.min(...vals).toFixed(1)
  const max  = Math.max(...vals).toFixed(1)
  const avg  = (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1)
  return { min, max, avg, range: (max - min).toFixed(1) }
}

const tempStats = computed(() => stats(history.value.temperature))
const humStats  = computed(() => stats(history.value.humidity))
const watStats  = computed(() => stats(history.value.water_level))

function toDataset(arr, color, label) {
  return [{
    label,
    data: (arr || []).map(p => p.v),
    borderColor: color,
    backgroundColor: color + '15',
    fill: true,
    tension: 0.3,
    pointRadius: 0
  }]
}
function toLabels(arr) {
  return (arr || []).map(p => new Date(p.t).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }))
}
</script>

<template>
  <div class="historico">

    <!-- Period selector -->
    <div class="period-bar">
      <button
        v-for="p in periods" :key="p.id"
        class="period-btn" :class="{ active: period === p.id }"
        @click="period = p.id"
      >{{ p.label }}</button>
    </div>

    <div v-if="loading" class="loading-msg">Cargando datos históricos…</div>

    <ErrorState
      v-else-if="fetchError"
      :message="fetchError.message"
      :status="fetchError.status"
      :retry-exhausted="fetchError.retryExhausted"
      @retry="loadHistory()"
    />

    <template v-else>
      <!-- Temperature -->
      <DataCard title="Temperatura interior">
        <div class="stat-pills">
          <div class="pill"><span class="pill-label">Mín</span><span class="pill-val">{{ tempStats.min }}°C</span></div>
          <div class="pill"><span class="pill-label">Máx</span><span class="pill-val">{{ tempStats.max }}°C</span></div>
          <div class="pill"><span class="pill-label">Media</span><span class="pill-val">{{ tempStats.avg }}°C</span></div>
          <div class="pill"><span class="pill-label">Rango</span><span class="pill-val">{{ tempStats.range }}°C</span></div>
        </div>
        <LineChart :datasets="toDataset(history.temperature, '#1D9E75', 'Temperatura')" :labels="toLabels(history.temperature)" :height="160" />
      </DataCard>

      <!-- Humidity -->
      <DataCard title="Humedad relativa">
        <div class="stat-pills">
          <div class="pill"><span class="pill-label">Mín</span><span class="pill-val">{{ humStats.min }}%</span></div>
          <div class="pill"><span class="pill-label">Máx</span><span class="pill-val">{{ humStats.max }}%</span></div>
          <div class="pill"><span class="pill-label">Media</span><span class="pill-val">{{ humStats.avg }}%</span></div>
          <div class="pill"><span class="pill-label">Rango</span><span class="pill-val">{{ humStats.range }}%</span></div>
        </div>
        <LineChart :datasets="toDataset(history.humidity, '#8B5CF6', 'Humedad')" :labels="toLabels(history.humidity)" :height="160" />
      </DataCard>

      <!-- Water level -->
      <DataCard title="Nivel de agua">
        <div class="stat-pills">
          <div class="pill"><span class="pill-label">Mín</span><span class="pill-val">{{ watStats.min }}%</span></div>
          <div class="pill"><span class="pill-label">Máx</span><span class="pill-val">{{ watStats.max }}%</span></div>
          <div class="pill"><span class="pill-label">Media</span><span class="pill-val">{{ watStats.avg }}%</span></div>
          <div class="pill"><span class="pill-label">Rango</span><span class="pill-val">{{ watStats.range }}%</span></div>
        </div>
        <LineChart :datasets="toDataset(history.water_level, '#378ADD', 'Nivel agua')" :labels="toLabels(history.water_level)" :height="160" />
      </DataCard>
    </template>

  </div>
</template>

<style scoped>
.historico { display: flex; flex-direction: column; gap: 14px; }

.period-bar { display: flex; gap: 6px; }
.period-btn {
  padding: 6px 16px;
  border-radius: 5px;
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
  background: var(--card-bg);
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.period-btn.active { background: var(--green); color: #fff; border-color: var(--green); }
.period-btn:hover:not(.active) { border-color: var(--green); color: var(--green); }

.loading-msg { padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; }

.stat-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.pill {
  background: var(--card-alt);
  border-radius: 5px;
  padding: 6px 10px;
  display: flex; flex-direction: column; gap: 1px;
}
.pill-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); }
.pill-val   { font-size: 14px; font-weight: 700; color: var(--text); }
</style>
