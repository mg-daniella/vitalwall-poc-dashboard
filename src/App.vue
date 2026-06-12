<script setup>
import { onMounted } from 'vue'
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
const { connect } = useWebSocket()

onMounted(async () => {
  const [sensorsResult, healthResult] = await Promise.allSettled([
    sensors.fetchInitial(),
    health.fetchHealth()
  ])
  if (sensorsResult.status === 'rejected' || sensors.error) {
    toasts.error('No se pudieron cargar los sensores. ' + (sensors.error?.message || ''))
  }
  if (healthResult.status === 'rejected' || health.error) {
    toasts.error('No se pudo verificar el estado del sistema. ' + (health.error?.message || ''))
  }
  env.fetchInitial().catch(() => {})
  metrics.fetchInitial().catch(() => {})
  air.fetchInitial().catch(() => {})
  rules.fetchRules().catch(() => {})
  connect()
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="main-area">
      <AppTopbar />
      <div class="view-content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
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

/* ─── Route fade transition ──────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
