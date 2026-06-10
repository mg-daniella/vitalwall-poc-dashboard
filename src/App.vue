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

const sensors  = useSensorsStore()
const env      = useEnvironmentStore()
const metrics  = useMetricsStore()
const air      = useAirQualityStore()
const rules    = useRulesStore()
const health   = useSystemHealthStore()
const toasts   = useToastsStore()
const { connect } = useWebSocket()

onMounted(async () => {
  // Blocking critical path — app renders skeleton until both resolve
  const [sensorsResult, healthResult] = await Promise.allSettled([
    sensors.fetchInitial(),
    health.fetchHealth()
  ])

  // Surface fetch failures as toasts so the user knows even if they're not
  // on the affected view
  if (sensorsResult.status === 'rejected' || sensors.error) {
    toasts.error('No se pudieron cargar los sensores. ' + (sensors.error?.message || ''))
  }
  if (healthResult.status === 'rejected' || health.error) {
    toasts.error('No se pudo verificar el estado del sistema. ' + (health.error?.message || ''))
  }

  // Progressive — load in background, individual views show their own error states
  env.fetchInitial().catch(() => {})
  metrics.fetchInitial().catch(() => {})
  air.fetchInitial().catch(() => {})
  rules.fetchRules().catch(() => {})

  // Start WebSocket
  connect()
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppTopbar />
      <main class="app-content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <ToastNotifications />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.app-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}
</style>
