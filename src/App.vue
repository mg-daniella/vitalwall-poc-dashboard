<script setup>
import { onMounted, onUnmounted } from 'vue'
import AppSidebar          from '@/components/layout/AppSidebar.vue'
import AppTopbar           from '@/components/layout/AppTopbar.vue'
import ToastNotifications  from '@/components/ui/ToastNotifications.vue'
import { useSensorsStore }      from '@/stores/sensors'
import { useEnvironmentStore }  from '@/stores/environment'
import { useMetricsStore }      from '@/stores/metrics'
import { useAirQualityStore }   from '@/stores/airQuality'
import { useRulesStore }        from '@/stores/rules'
import { useSystemHealthStore } from '@/stores/systemHealth'
import { useWebSocket }         from '@/composables/useWebSocket'
import { useToastsStore }       from '@/stores/toasts'

const sensors = useSensorsStore()
const env     = useEnvironmentStore()
const metrics = useMetricsStore()
const air     = useAirQualityStore()
const rules   = useRulesStore()
const health  = useSystemHealthStore()
const toasts  = useToastsStore()
const { connect, disconnect } = useWebSocket()

onMounted(() => {
  sensors.fetchInitial().catch(() => {})
  health.fetchHealth().catch(() => {})
  env.fetchInitial().catch(() => {})
  metrics.fetchInitial().catch(() => {})
  air.fetchInitial().catch(() => {})
  rules.fetchRules().catch(() => {})
  connect()
})

onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="main-area">
      <AppTopbar />
      <div class="view-content">
        <RouterView />
      </div>
    </div>
    <ToastNotifications />
  </div>
</template>

<style>
/* ─── Global layout ──────────────────────────────────────────── */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  font-family: var(--font);
}
.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}
.view-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
}
.view-content::-webkit-scrollbar { width: 4px; }
.view-content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* ─── View inner padding (used by all views) ─────────────────── */
.view-inner {
  padding: var(--main-pt) var(--main-ph);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ─── Standard grids ─────────────────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: 10px;
}
.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

/* ─── Global card chrome ─────────────────────────────────────── */
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.08);
}

/* ─── Print: ESG report only ─────────────────────────────────── */
@media print {
  @page { margin: 15mm; size: A4; }

  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Hide chrome */
  .sidebar,
  .topbar { display: none !important; }

  /* Flatten layout so view fills the page */
  .app-layout,
  .main-area { display: block !important; height: auto !important; overflow: visible !important; }
  .view-content { overflow: visible !important; height: auto !important; }
  .view-inner   { padding: 0 !important; }

  /* Clean up card borders for paper */
  .card { box-shadow: none !important; border: 1px solid #ddd !important; }
}

</style>
