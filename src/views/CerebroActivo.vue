<script setup>
import { ref, computed } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import { useMetricsStore }   from '@/stores/metrics'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const wsStore = useWebSocketStore()
const metrics = useMetricsStore()

const filters = ref(['all'])
const filterOptions = [
  { label: 'Todos',         value: 'all' },
  { label: 'Decisiones IA', value: 'rule_update' },
  { label: 'Entorno',       value: 'environmental_update' },
  { label: 'Sensores',      value: 'sensor_update' },
  { label: 'Métricas',      value: 'metrics_update' },
  { label: 'Alertas',       value: 'alert' }
]

function toggleFilter(val) {
  if (val === 'all') { filters.value = ['all']; return }
  filters.value = filters.value.filter(f => f !== 'all')
  if (filters.value.includes(val)) filters.value = filters.value.filter(f => f !== val)
  else filters.value.push(val)
  if (!filters.value.length) filters.value = ['all']
}

const filteredEvents = computed(() => {
  if (filters.value.includes('all')) return wsStore.events
  return wsStore.events.filter(e => filters.value.includes(e.type))
})

const typeBreakdown = computed(() => {
  const counts = {}
  wsStore.events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
  return Object.entries(counts).map(([type, count]) => ({ type, count }))
})

const typeIconMap = {
  sensor_update:        { icon: '📡', color: 'var(--blue-raw)',  label: 'Sensor' },
  environmental_update: { icon: '🌤', color: 'var(--amber)',     label: 'Entorno' },
  air_quality_update:   { icon: '💨', color: 'var(--green)',     label: 'Aire' },
  rule_update:          { icon: '⚡', color: 'var(--green)',     label: 'Regla IA' },
  metrics_update:       { icon: '📊', color: 'var(--blue-raw)',  label: 'Métricas' },
  alert:                { icon: '🔔', color: 'var(--red)',       label: 'Alerta' },
  health_update:        { icon: '💚', color: 'var(--green)',     label: 'Salud' }
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function variantFor(type) {
  const m = { rule_update:'green', environmental_update:'amber', alert:'red', sensor_update:'blue', metrics_update:'blue' }
  return m[type] || 'gray'
}
</script>

<template>
  <div class="view-inner cerebro">

    <!-- Filters bar -->
    <div class="filters-bar">
      <button
        v-for="f in filterOptions" :key="f.value"
        class="filter-btn"
        :class="{ active: filters.includes(f.value) }"
        @click="toggleFilter(f.value)"
      >{{ f.label }}</button>
    </div>

    <div class="cerebro-layout">

      <!-- Event stream -->
      <div class="event-stream card">
        <div class="card-title">Flujo de eventos — {{ filteredEvents.length }} entradas</div>
        <div class="events-list">
          <div v-for="ev in filteredEvents" :key="ev.id" class="event-item">
            <div class="event-icon" :style="{ background: typeIconMap[ev.type]?.color + '22', color: typeIconMap[ev.type]?.color }">
              {{ typeIconMap[ev.type]?.icon || '•' }}
            </div>
            <div class="event-body">
              <div class="event-header">
                <StatusBadge :label="typeIconMap[ev.type]?.label || ev.type" :variant="variantFor(ev.type)" />
                <span class="event-time">{{ fmtTime(ev.time) }}</span>
              </div>
              <div class="event-message">{{ ev.message }}</div>
              <div v-if="ev.meta" class="event-meta">{{ ev.meta }}</div>
            </div>
          </div>
          <div v-if="!filteredEvents.length" class="empty-state">
            Sin eventos para los filtros seleccionados
          </div>
        </div>
      </div>

      <!-- Stats sidebar -->
      <div class="stats-sidebar">

        <div class="card stats-card">
          <div class="card-title">Eventos totales</div>
          <div class="big-num">{{ wsStore.events.length }}</div>
          <div class="connected-badge">
            <span class="ws-dot" :class="{ live: wsStore.connected }"></span>
            {{ wsStore.connected ? 'WebSocket activo' : 'Desconectado' }}
          </div>
        </div>

        <div class="card stats-card">
          <div class="card-title">Por tipo</div>
          <div class="breakdown">
            <div v-for="item in typeBreakdown" :key="item.type" class="breakdown-row">
              <span class="breakdown-label">{{ typeIconMap[item.type]?.label || item.type }}</span>
              <div class="breakdown-bar-track">
                <div class="breakdown-bar" :style="{ width: (item.count / wsStore.events.length * 100) + '%', background: typeIconMap[item.type]?.color || 'var(--text-muted)' }"></div>
              </div>
              <span class="breakdown-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="card stats-card">
          <div class="card-title">Estado energético</div>
          <div class="energy-row">
            <span class="energy-label">Solar</span>
            <span class="energy-val">{{ metrics.energy_source.solar_pct }}%</span>
          </div>
          <div class="energy-row">
            <span class="energy-label">Batería</span>
            <span class="energy-val">{{ metrics.energy_source.battery_pct }}%</span>
          </div>
          <div class="energy-row">
            <span class="energy-label">Red</span>
            <span class="energy-val">{{ metrics.energy_source.grid_pct }}%</span>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.cerebro { display: flex; flex-direction: column; gap: 14px; }

.filters-bar {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.filter-btn {
  padding: 5px 12px;
  border-radius: var(--radius-badge);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  background: var(--card-bg);
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.filter-btn:hover { border-color: var(--green); color: var(--green); }
.filter-btn.active { background: var(--green); color: #fff; border-color: var(--green); }

.cerebro-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.event-stream { max-height: calc(100vh - 200px); overflow: hidden; display: flex; flex-direction: column; }
.events-list { overflow-y: auto; flex: 1; }

.event-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.event-item:last-child { border-bottom: none; }
.event-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.event-body { flex: 1; min-width: 0; }
.event-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.event-time { font-size: 10px; color: var(--text-muted); margin-left: auto; font-variant-numeric: tabular-nums; }
.event-message { font-size: 12px; color: var(--text); font-weight: 500; }
.event-meta { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.empty-state { padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; }

.stats-sidebar { display: flex; flex-direction: column; gap: 12px; }
.stats-card { display: flex; flex-direction: column; gap: 8px; }
.big-num { font-size: 40px; font-weight: 700; letter-spacing: -1px; color: var(--text); }
.connected-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); font-weight: 500; }
.ws-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }
.ws-dot.live { background: var(--green); box-shadow: 0 0 4px rgba(29,158,117,0.6); }

.breakdown { display: flex; flex-direction: column; gap: 5px; }
.breakdown-row { display: flex; align-items: center; gap: 6px; }
.breakdown-label { font-size: 10px; color: var(--text-secondary); width: 56px; flex-shrink: 0; }
.breakdown-bar-track { flex: 1; height: 4px; background: var(--card-alt); border-radius: 2px; overflow: hidden; }
.breakdown-bar { height: 100%; border-radius: 2px; transition: width 0.4s; }
.breakdown-count { font-size: 10px; color: var(--text-muted); width: 16px; text-align: right; }

.energy-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--border); }
.energy-row:last-child { border-bottom: none; }
.energy-label { color: var(--text-secondary); font-weight: 500; }
.energy-val   { color: var(--text); font-weight: 600; }
</style>
