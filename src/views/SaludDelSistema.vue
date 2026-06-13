<script setup>
import { useSystemHealthStore } from '@/stores/systemHealth'
import { useRelativeTime }      from '@/composables/useRelativeTime'
import StatusDot   from '@/components/ui/StatusDot.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import InsightBox  from '@/components/ui/InsightBox.vue'
import ErrorState  from '@/components/ui/ErrorState.vue'

const health = useSystemHealthStore()
const { relativeTime } = useRelativeTime()

const apiLabels = {
  open_meteo: 'Open-Meteo',
  nasa_power: 'NASA Power',
  redata:     'REData',
  effis:      'EFFIS',
  aemet:      'AEMET'
}
const apiDesc = {
  open_meteo: 'Previsión meteorológica',
  nasa_power: 'Radiación solar e irradiancia',
  redata:     'Mix eléctrico nacional',
  effis:      'Índice FWI e incendios',
  aemet:      'Datos meteorológicos oficiales'
}

function uptimePct(status) {
  return status === 'ok' ? 'Operativo' : 'Degradado'
}
</script>

<template>
  <div class="view-inner salud">

    <ErrorState
      v-if="health.error"
      :message="health.error.message"
      :status="health.error.status"
      :retry-exhausted="health.error.retryExhausted"
      :retrying="health.retrying"
      @retry="health.retry()"
    />
    <InsightBox
      v-else
      :text="(() => {
        const total = Object.keys(health.apis).length
        const ok    = Object.values(health.apis).filter(a => a.status === 'ok').length
        const sensor = health.sensors.status === 'ok' ? 'Sensor operativo.' : 'Sensor con problemas.'
        return ok === total
          ? `${sensor} ${ok}/${total} APIs respondiendo correctamente.`
          : `${sensor} ${ok}/${total} APIs operativas — ${total - ok} fuente(s) con problemas.`
      })()"
    />

    <!-- Sensors block -->
    <div class="card">
      <div class="card-title">Sensores internos</div>
      <div class="health-item">
        <StatusDot :status="health.sensors.status" />
        <div class="health-body">
          <div class="health-name">Módulo de sensores TH-01</div>
          <div class="health-desc">Temperatura, humedad, nivel de agua, batería</div>
        </div>
        <div class="health-meta">
          <StatusBadge :label="health.sensors.status === 'ok' ? 'Operativo' : 'Error'" :variant="health.sensors.status === 'ok' ? 'green' : 'red'" />
          <span class="health-time">{{ relativeTime(health.sensors.last_seen) }}</span>
        </div>
      </div>
    </div>

    <!-- APIs block -->
    <div class="card">
      <div class="card-title">APIs externas ({{ Object.keys(health.apis).length }} fuentes)</div>
      <div v-for="(api, key) in health.apis" :key="key" class="health-item">
        <StatusDot :status="api.status" />
        <div class="health-body">
          <div class="health-name">{{ apiLabels[key] || key }}</div>
          <div class="health-desc">{{ apiDesc[key] || 'Fuente de datos externa' }}</div>
        </div>
        <div class="health-meta">
          <StatusBadge :label="api.status === 'ok' ? 'OK' : 'Error'" :variant="api.status === 'ok' ? 'green' : 'red'" />
          <span class="health-uptime">{{ uptimePct(api.status) }} uptime</span>
          <span class="health-time">{{ relativeTime(api.last_updated) }}</span>
        </div>
      </div>
    </div>

    <!-- Summary grid -->
    <div class="summary-grid">
      <div class="summary-card card">
        <div class="card-title">APIs activas</div>
        <div class="summary-num green">{{ Object.values(health.apis).filter(a => a.status === 'ok').length }} / {{ Object.keys(health.apis).length }}</div>
      </div>
      <div class="summary-card card">
        <div class="card-title">Sensores</div>
        <div class="summary-num" :class="health.sensors.status === 'ok' ? 'green' : 'red'">{{ health.sensors.status === 'ok' ? 'OK' : 'Error' }}</div>
      </div>
      <div class="summary-card card">
        <div class="card-title">Último dato</div>
        <div class="summary-num" style="font-size: 18px;">{{ relativeTime(health.sensors.last_seen) }}</div>
      </div>
      <div class="summary-card card">
        <div class="card-title">Modo</div>
        <div class="summary-num green" style="font-size: 18px;">En vivo</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.salud { display: flex; flex-direction: column; gap: 14px; }

.health-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.health-item:last-child { border-bottom: none; }
.health-body { flex: 1; }
.health-name { font-size: 13px; font-weight: 600; color: var(--text); }
.health-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.health-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.health-time   { font-size: 10px; color: var(--text-muted); }
.health-uptime { font-size: 10px; color: var(--text-muted); }

.summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.summary-card { text-align: center; padding: 18px 12px; }
.summary-num { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); margin-top: 6px; }
.summary-num.green { color: var(--green); }
.summary-num.red   { color: var(--red); }
</style>
