<script setup>
import { computed } from 'vue'
import { dummyApiLog } from '@/data/dummy'
import { useSystemHealthStore } from '@/stores/systemHealth'
import StatusDot   from '@/components/ui/StatusDot.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const health = useSystemHealthStore()

const apiLabels = {
  open_meteo: 'Open-Meteo',
  nasa_power: 'NASA Power',
  redata:     'REData',
  effis:      'EFFIS',
  aemet:      'AEMET'
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const groupedLogs = computed(() => {
  const groups = {}
  dummyApiLog.forEach(log => {
    const day = fmtDate(log.time)
    if (!groups[day]) groups[day] = []
    groups[day].push(log)
  })
  return groups
})

const callsToday = computed(() => {
  const counts = {}
  dummyApiLog.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1 })
  return Object.entries(counts).map(([source, count]) => ({ source, count }))
})

function sourceVariant(src) {
  const m = { 'Open-Meteo':'blue', 'AEMET':'amber', 'EFFIS':'red', 'REData':'green', 'NASA POWER':'blue' }
  return m[src] || 'gray'
}
</script>

<template>
  <div class="view-inner log-layout">

    <!-- Log column -->
    <div class="log-col">
      <div v-for="(entries, date) in groupedLogs" :key="date" class="log-group">
        <div class="log-date">{{ date }}</div>
        <div class="log-entries card">
          <div v-for="entry in entries" :key="entry.id" class="log-entry">
            <span class="log-time">{{ fmtTime(entry.time) }}</span>
            <StatusBadge :label="entry.source" :variant="sourceVariant(entry.source)" />
            <span class="log-msg">{{ entry.message }}</span>
            <code class="log-payload">{{ entry.payload }}</code>
            <StatusBadge :label="entry.status" :variant="entry.status === 'ok' ? 'green' : 'red'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Stats sidebar -->
    <div class="log-stats">
      <div class="card">
        <div class="card-title">Estado de APIs</div>
        <div v-for="(api, key) in health.apis" :key="key" class="api-status-row">
          <StatusDot :status="api.status" />
          <span class="api-name">{{ apiLabels[key] || key }}</span>
          <span class="api-time">{{ api.status === 'ok' ? 'OK' : 'Error' }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Llamadas hoy</div>
        <div v-for="item in callsToday" :key="item.source" class="calls-row">
          <StatusBadge :label="item.source" :variant="sourceVariant(item.source)" />
          <span class="calls-count">{{ item.count }}</span>
        </div>
        <div class="calls-total">Total: {{ dummyApiLog.length }} llamadas</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.log-layout { display: grid; grid-template-columns: 1fr 260px; gap: 16px; align-items: start; }

.log-col { display: flex; flex-direction: column; gap: 14px; }
.log-date {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted);
  margin-bottom: 6px;
}
.log-entries { display: flex; flex-direction: column; gap: 0; padding: 0; overflow: hidden; }
.log-entry {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
}
.log-entry:last-child { border-bottom: none; }
.log-time { font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.log-msg  { font-size: 12px; color: var(--text); flex: 1; min-width: 120px; }
.log-payload { font-size: 10px; color: var(--text-muted); background: var(--card-alt); border-radius: 3px; padding: 2px 5px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.log-stats { display: flex; flex-direction: column; gap: 12px; }

.api-status-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
}
.api-status-row:last-child { border-bottom: none; }
.api-name { flex: 1; color: var(--text); font-weight: 500; }
.api-time  { font-size: 10px; color: var(--text-muted); }

.calls-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; }
.calls-count { font-size: 13px; font-weight: 700; color: var(--text); }
.calls-total { font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 8px; margin-top: 4px; }
</style>
