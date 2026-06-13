<script setup>
import { onMounted } from 'vue'
import { useRoute }     from 'vue-router'
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
const route = useRoute()

// JS-controlled transition — never depends on CSS transitionend events
function onLeave(el, done) {
  el.style.transition = 'opacity 0.05s ease'
  el.style.opacity = '0'
  setTimeout(done, 60)          // call done() ourselves — guaranteed to fire
}
function onEnter(el, done) {
  el.style.opacity = '0'
  el.style.transition = 'opacity 0.08s ease'
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    setTimeout(done, 90)
  })
}
function onAfterEnter(el) {
  el.style.transition = ''
  el.style.opacity    = ''
}
function onAfterLeave(el) {
  el.style.transition = ''
  el.style.opacity    = ''
}

onMounted(() => {
  // All stores fetch in parallel — no store waits for another
  sensors.fetchInitial().catch(() => {})
  health.fetchHealth().catch(() => {})
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
          <Transition
            mode="out-in"
            :css="false"
            @leave="onLeave"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @after-leave="onAfterLeave"
          >
            <component :is="Component" :key="route.path" />
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

/* Route transitions are JS-controlled (css:false) — no CSS rules needed */
</style>
