<script setup>
import { ref, computed } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import { useMetricsStore }   from '@/stores/metrics'

const wsStore = useWebSocketStore()
const metrics = useMetricsStore()

const filters = ref(['all'])
const filterOptions = [
  { label: 'Todos',         value: 'all' },
  { label: 'Vital Mind',    value: 'rule_update' },
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
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
})

const typeIconMap = {
  sensor_update:        { icon: 'ti-radar-2',           color: 'var(--blue-raw)',  label: 'Sensor'   },
  environmental_update: { icon: 'ti-cloud-sun',          color: 'var(--blue-raw)',  label: 'Entorno'  },
  air_quality_update:   { icon: 'ti-wind',               color: 'var(--blue-raw)',  label: 'Aire'     },
  rule_update:          { icon: 'ti-bolt',               color: 'var(--blue-raw)',  label: 'Regla IA' },
  metrics_update:       { icon: 'ti-chart-bar',          color: 'var(--blue-raw)',  label: 'Métricas' },
  alert:                { icon: 'ti-bell-ringing',       color: 'var(--text-muted)', label: 'Alerta'  },
  health_update:        { icon: 'ti-heart-rate-monitor', color: 'var(--blue-raw)',  label: 'Salud'    }
}

// Relative time
function relTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)  return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
  return `hace ${Math.floor(diff / 3600)}h`
}

function absTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const energySrc = computed(() => metrics.energy_source || { solar_pct: 10, battery_pct: 23, grid_pct: 67 })
const energyRows = computed(() => [
  { label: 'Solar',   pct: energySrc.value.solar_pct },
  { label: 'Batería', pct: energySrc.value.battery_pct },
  { label: 'Red',     pct: energySrc.value.grid_pct },
])
</script>

<template>
  <div class="view-inner cerebro">

    <!-- Filter tabs — segmented pill style -->
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

        <!-- Feed header -->
        <div class="stream-header">
          <div class="stream-title-group">
            <span class="stream-live-dot"></span>
            <span class="stream-title">Flujo de eventos</span>
            <span class="stream-count">{{ filteredEvents.length }} entradas</span>
          </div>
          <span class="stream-hint">actualización en tiempo real</span>
        </div>

        <!-- Events -->
        <div class="events-list">
          <div v-if="!filteredEvents.length" class="empty-state">
            <i class="ti ti-filter-off empty-icon" aria-hidden="true"></i>
            <span class="empty-title">Sin eventos</span>
            <span class="empty-sub">No hay eventos para los filtros seleccionados.</span>
          </div>

          <div v-for="ev in filteredEvents" :key="ev.id"
               class="event-item"
               :style="{ '--ev-color': typeIconMap[ev.type]?.color || 'var(--text-muted)' }">
            <!-- Left accent -->
            <div class="event-accent"></div>
            <!-- Icon -->
            <div class="event-icon">
              <i :class="`ti ${typeIconMap[ev.type]?.icon || 'ti-circle'}`" aria-hidden="true"></i>
            </div>
            <!-- Body -->
            <div class="event-body">
              <div class="event-top">
                <span class="event-type-label">{{ typeIconMap[ev.type]?.label || ev.type }}</span>
                <span class="event-time-rel">{{ relTime(ev.time) }}</span>
                <span class="event-time-abs">{{ absTime(ev.time) }}</span>
              </div>
              <div class="event-message">{{ ev.message }}</div>
              <div v-if="ev.meta" class="event-meta">{{ ev.meta }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Stats sidebar -->
      <div class="stats-sidebar">

        <!-- Total events -->
        <div class="card stats-card">
          <div class="card-title-sm">Eventos totales</div>
          <div class="big-num">{{ wsStore.events.length }}</div>
          <div class="big-num-sub">esta sesión</div>
          <div class="connected-badge" :class="{ live: wsStore.connected }">
            <span class="ws-dot"></span>
            {{ wsStore.connected ? 'WebSocket activo' : 'Desconectado' }}
          </div>
        </div>

        <!-- By type -->
        <div class="card stats-card">
          <div class="card-title-sm">Por tipo</div>
          <div class="breakdown">
            <div v-for="item in typeBreakdown" :key="item.type" class="breakdown-row">
              <span class="breakdown-label">{{ typeIconMap[item.type]?.label || item.type }}</span>
              <div class="breakdown-bar-track">
                <div class="breakdown-bar"
                     :style="{ width: (item.count / wsStore.events.length * 100) + '%' }">
                </div>
              </div>
              <span class="breakdown-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- Energy state -->
        <div class="card stats-card">
          <div class="card-title-sm">Estado energético</div>
          <div class="energy-list">
            <div v-for="row in energyRows" :key="row.label" class="energy-row">
              <div class="energy-top">
                <span class="energy-label">{{ row.label }}</span>
                <span class="energy-val">{{ row.pct }}%</span>
              </div>
              <div class="energy-track">
                <div class="energy-fill" :style="{ width: row.pct + '%', opacity: row.label === 'Red' ? 0.35 : 0.85 }"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.cerebro { display: flex; flex-direction: column; gap: 14px; }

/* ── Filter tabs — segmented pill ── */
.filters-bar {
  display: inline-flex;
  background: var(--card-alt);
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
  align-self: flex-start;
}
.filter-btn {
  padding: 7px 16px;
  border-radius: 7px;
  font-size: 12px; font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.filter-btn:hover:not(.active) { color: var(--text); }
.filter-btn.active {
  background: var(--card-bg);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px var(--border);
}

/* ── Layout ── */
.cerebro-layout {
  display: grid;
  grid-template-columns: 1fr 264px;
  gap: 14px;
  align-items: start;
}

/* ── Event stream ── */
.event-stream {
  max-height: calc(100vh - 190px);
  overflow: hidden;
  display: flex; flex-direction: column;
}

/* Feed header */
.stream-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.stream-title-group { display: flex; align-items: center; gap: 8px; }
.stream-live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--blue-raw);
  box-shadow: 0 0 5px rgba(55,138,221,0.55);
  animation: pulse-live 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.3} }
.stream-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.7px; color: var(--text);
}
.stream-count {
  font-size: 10px; font-weight: 600; color: var(--blue-raw);
  background: rgba(55,138,221,0.10); border-radius: 10px;
  padding: 1px 8px;
}
.stream-hint { font-size: 10px; color: var(--text-muted); }

/* Events list */
.events-list { overflow-y: auto; flex: 1; scrollbar-width: thin; }

.event-item {
  display: flex; align-items: stretch; gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.event-item:last-child { border-bottom: none; }
.event-item:hover { background: var(--card-alt); }

.event-accent {
  width: 3px; flex-shrink: 0; border-radius: 2px;
  background: var(--ev-color);
  opacity: 0.7;
  margin: 2px 0;
}
.event-icon {
  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
  background: color-mix(in srgb, var(--ev-color) 10%, transparent);
  color: var(--ev-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  align-self: flex-start; margin-top: 1px;
}
.event-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }

.event-top { display: flex; align-items: center; gap: 7px; }
.event-type-label {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.7px; color: var(--ev-color);
}
.event-time-rel {
  font-size: 10px; font-weight: 600; color: var(--text-secondary);
  margin-left: auto;
}
.event-time-abs {
  font-size: 10px; color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.event-message { font-size: 12px; font-weight: 500; color: var(--text); line-height: 1.4; }
.event-meta    { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px;
  padding: 52px 20px; text-align: center;
}
.empty-icon  { font-size: 30px; color: var(--border-strong); margin-bottom: 4px; }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.empty-sub   { font-size: 12px; color: var(--text-muted); max-width: 280px; line-height: 1.6; }

/* ── Stats sidebar ── */
.stats-sidebar { display: flex; flex-direction: column; gap: 12px; }
.stats-card    { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }

.card-title-sm {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted);
}

.big-num     { font-size: 44px; font-weight: 700; letter-spacing: -2px; color: var(--text); line-height: 1; }
.big-num-sub { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: -4px; }

.connected-badge {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--text-muted); font-weight: 500;
}
.ws-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted); flex-shrink: 0;
}
.connected-badge.live { color: var(--blue-raw); }
.connected-badge.live .ws-dot {
  background: var(--blue-raw);
  box-shadow: 0 0 5px rgba(55,138,221,0.6);
  animation: pulse-live 2s infinite;
}

/* By type breakdown */
.breakdown { display: flex; flex-direction: column; gap: 8px; }
.breakdown-row { display: flex; align-items: center; gap: 8px; }
.breakdown-label { font-size: 11px; color: var(--text-secondary); width: 58px; flex-shrink: 0; font-weight: 500; }
.breakdown-bar-track { flex: 1; height: 5px; background: var(--card-alt); border-radius: 3px; overflow: hidden; }
.breakdown-bar { height: 100%; border-radius: 3px; background: var(--blue-raw); opacity: 0.75; transition: width 0.4s; }
.breakdown-count { font-size: 11px; font-weight: 700; color: var(--text); width: 18px; text-align: right; flex-shrink: 0; }

/* Energy state */
.energy-list { display: flex; flex-direction: column; gap: 10px; }
.energy-row  { display: flex; flex-direction: column; gap: 5px; }
.energy-top  { display: flex; justify-content: space-between; align-items: baseline; }
.energy-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
.energy-val   { font-size: 13px; font-weight: 700; color: var(--text); }
.energy-track { height: 5px; background: var(--card-alt); border-radius: 3px; overflow: hidden; }
.energy-fill  { height: 100%; background: var(--blue-raw); border-radius: 3px; transition: width 0.4s; }
</style>
