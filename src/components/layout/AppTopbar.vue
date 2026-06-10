<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts'
import { useWebSocketStore } from '@/stores/websocket'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const route   = useRoute()
const alerts  = useAlertsStore()
const wsStore = useWebSocketStore()

const viewMeta = {
  '/':            { title: 'Panel General',     sub: 'Vista unificada del sistema VitalWall' },
  '/cerebro':     { title: 'Cerebro Activo',    sub: 'Flujo de eventos en tiempo real' },
  '/decisiones':  { title: 'Decisiones IA',     sub: 'Gestión de reglas y override manual' },
  '/capas':       { title: 'Capas de la Pared', sub: 'Interacción con la fachada inteligente' },
  '/clima':       { title: 'Clima y Previsión', sub: 'Condiciones exteriores y pronóstico 12h' },
  '/red':         { title: 'Red Eléctrica',     sub: 'Gestión energética y renovables' },
  '/aire':        { title: 'Calidad del Aire',  sub: 'Índices de contaminantes y AQI' },
  '/confort':     { title: 'Confort',           sub: 'Parámetros de bienestar y configuración' },
  '/historico':   { title: 'Histórico',         sub: 'Series temporales de sensores' },
  '/log':         { title: 'Log de APIs',       sub: 'Registro de llamadas a fuentes externas' },
  '/salud':       { title: 'Salud del Sistema', sub: 'Estado de sensores y APIs conectadas' },
  '/alertas':     { title: 'Alertas',           sub: 'Avisos activos y resueltos' },
  '/agua':        { title: 'Agua y Sequía',     sub: 'Gestión hídrica y autonomía' },
  '/emergencias': { title: 'Emergencias',       sub: 'Alertas externas críticas' }
}

const current = computed(() => viewMeta[route.path] || { title: 'Dashboard', sub: '' })
const now = computed(() => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="topbar-title">{{ current.title }}</h1>
      <span class="topbar-sub">{{ current.sub }}</span>
    </div>
    <div class="topbar-right">
      <StatusBadge v-if="wsStore.connected" label="En vivo" variant="green" />
      <StatusBadge v-else label="Offline" variant="gray" />
      <StatusBadge v-if="alerts.activeCount > 0" :label="`${alerts.activeCount} alertas`" variant="amber" />
      <span class="topbar-time">{{ now }}</span>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-height);
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: baseline; gap: 10px; }
.topbar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.2px;
}
.topbar-sub {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.topbar-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
