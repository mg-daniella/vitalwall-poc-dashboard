<script setup>
import { computed } from 'vue'
import { useAlertsStore } from '@/stores/alerts'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const alertsStore = useAlertsStore()

const active   = computed(() => alertsStore.alerts.filter(a => !a.acknowledged && a.severity === 'danger'))
const warnings = computed(() => alertsStore.alerts.filter(a => !a.acknowledged && a.severity === 'warning'))
const resolved = computed(() => alertsStore.alerts.filter(a => a.acknowledged))

function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  return mins < 60 ? `hace ${mins}m` : `hace ${Math.floor(mins/60)}h`
}

const statusGrid = [
  { key: 'incendio', label: 'Incendio', icon: '🔥', status: 'ok' },
  { key: 'agua',     label: 'Agua',     icon: '💧', status: 'ok' },
  { key: 'sensores', label: 'Sensores', icon: '📡', status: 'ok' },
  { key: 'bateria',  label: 'Batería',  icon: '🔋', status: 'ok' }
]
</script>

<template>
  <div class="view-inner alertas">

    <!-- Active alerts (danger) -->
    <section v-if="active.length">
      <div class="section-label danger">Alertas activas — {{ active.length }}</div>
      <div v-for="alert in active" :key="alert.id" class="alert-banner danger-banner">
        <div class="alert-header">
          <span class="alert-icon">🚨</span>
          <StatusBadge :label="alert.code" variant="red" />
          <StatusBadge :label="alert.source" variant="gray" />
          <span class="alert-time">{{ relativeTime(alert.timestamp) }}</span>
        </div>
        <div class="alert-title">{{ alert.title }}</div>
        <div class="alert-desc">{{ alert.description }}</div>
        <div class="alert-action">
          <span class="action-label">Acción IA:</span> {{ alert.ai_action }}
        </div>
        <div class="alert-buttons">
          <button class="btn-confirm" @click="alertsStore.acknowledgeAlert(alert.id)">Confirmar</button>
          <button class="btn-view">Ver detalle</button>
        </div>
      </div>
    </section>

    <!-- Warnings -->
    <section v-if="warnings.length">
      <div class="section-label warning">Avisos activos — {{ warnings.length }}</div>
      <div v-for="alert in warnings" :key="alert.id" class="alert-banner warning-banner">
        <div class="alert-header">
          <span class="alert-icon">⚠</span>
          <StatusBadge :label="alert.code" variant="amber" />
          <StatusBadge :label="alert.source" variant="gray" />
          <span class="alert-time">{{ relativeTime(alert.timestamp) }}</span>
        </div>
        <div class="alert-title">{{ alert.title }}</div>
        <div class="alert-desc">{{ alert.description }}</div>
        <div class="alert-action">
          <span class="action-label">Acción IA:</span> {{ alert.ai_action }}
        </div>
        <div class="alert-buttons">
          <button class="btn-confirm warning-btn" @click="alertsStore.acknowledgeAlert(alert.id)">Confirmar</button>
          <button class="btn-view">Ver detalle</button>
        </div>
      </div>
    </section>

    <!-- Resolved -->
    <section v-if="resolved.length">
      <div class="section-label resolved">Resueltos — {{ resolved.length }}</div>
      <div v-for="alert in resolved" :key="alert.id" class="alert-banner resolved-banner">
        <div class="alert-header">
          <span class="alert-icon">✓</span>
          <StatusBadge :label="alert.code" variant="gray" />
          <StatusBadge :label="alert.source" variant="gray" />
          <span class="alert-time">{{ relativeTime(alert.timestamp) }}</span>
        </div>
        <div class="alert-title resolved-title">{{ alert.title }}</div>
      </div>
    </section>

    <!-- No alerts -->
    <div v-if="!active.length && !warnings.length" class="no-alerts">
      <div class="no-alert-icon">✅</div>
      <div class="no-alert-title">Sin alertas activas</div>
      <div class="no-alert-sub">Todos los sistemas operan dentro de parámetros normales.</div>
    </div>

    <!-- Status grid -->
    <div class="status-grid">
      <div v-for="item in statusGrid" :key="item.key" class="status-item card">
        <span class="status-icon">{{ item.icon }}</span>
        <div class="status-label">{{ item.label }}</div>
        <StatusBadge label="Normal" variant="green" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.alertas { display: flex; flex-direction: column; gap: 14px; }

.section-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;
  margin-bottom: 8px;
}
.section-label.danger  { color: var(--red); }
.section-label.warning { color: var(--amber); }
.section-label.resolved { color: var(--text-muted); }

.alert-banner {
  border-radius: var(--radius-card);
  padding: 14px 16px;
  border: 1px solid;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.danger-banner  { background: rgba(226,75,74,0.06);  border-color: rgba(226,75,74,0.25); }
.warning-banner { background: rgba(239,159,39,0.06); border-color: rgba(239,159,39,0.25); }
.resolved-banner { background: var(--card-alt); border-color: var(--border); opacity: 0.65; }

.alert-header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.alert-icon   { font-size: 16px; }
.alert-time   { font-size: 10px; color: var(--text-muted); margin-left: auto; }
.alert-title  { font-size: 14px; font-weight: 700; color: var(--text); }
.resolved-title { color: var(--text-muted); font-weight: 500; font-size: 13px; }
.alert-desc   { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.alert-action { font-size: 11px; color: var(--text-secondary); background: var(--card-alt); border-radius: 4px; padding: 6px 10px; }
.action-label { font-weight: 600; color: var(--text); }
.alert-buttons { display: flex; gap: 6px; }
.btn-confirm {
  padding: 5px 12px; border-radius: 4px;
  font-size: 11px; font-weight: 600;
  background: var(--red); color: #fff;
}
.btn-confirm.warning-btn { background: var(--amber); }
.btn-view {
  padding: 5px 12px; border-radius: 4px;
  font-size: 11px; font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.no-alerts { text-align: center; padding: 40px; }
.no-alert-icon  { font-size: 36px; margin-bottom: 8px; }
.no-alert-title { font-size: 16px; font-weight: 700; color: var(--text); }
.no-alert-sub   { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.status-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 10px;
}
.status-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 10px; text-align: center; }
.status-icon  { font-size: 24px; }
.status-label { font-size: 12px; font-weight: 600; color: var(--text); }
</style>
