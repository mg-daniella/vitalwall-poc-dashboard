<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAlertsStore }    from '@/stores/alerts'
import { useWebSocketStore } from '@/stores/websocket'

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
const nowStr  = computed(() => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <header class="topbar">
    <div>
      <div class="topbar-title">{{ current.title }}</div>
      <div class="topbar-sub">{{ current.sub }}</div>
    </div>
    <div class="topbar-right">
      <span class="topbar-tag" :class="wsStore.connected ? 'topbar-tag-ok' : 'topbar-tag'">
        {{ wsStore.connected ? '● En vivo' : '○ Offline' }}
      </span>
      <span v-if="alerts.activeCount > 0" class="topbar-tag topbar-tag-warn">
        ⚠ {{ alerts.activeCount }} alertas
      </span>
      <span class="topbar-tag">{{ nowStr }}</span>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  padding: 13px 30px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.topbar-title {
  font-size: 24px; font-weight: 700; letter-spacing: -0.3px;
  color: var(--text); line-height: 1;
}
.topbar-sub { font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-top: 3px; }
.topbar-right { display: flex; gap: 8px; align-items: center; }
.topbar-tag {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;
  color: var(--text-muted); background: var(--card-alt);
  padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border);
}
.topbar-tag-ok {
  color: var(--green-light); border-color: rgba(29,158,117,0.3);
  background: rgba(29,158,117,0.07);
}
.topbar-tag-warn {
  color: #854F0B; border-color: rgba(239,159,39,0.3);
  background: rgba(239,159,39,0.07);
}
.topbar-tag-danger {
  color: #A32D2D; border-color: rgba(226,75,74,0.3);
  background: rgba(226,75,74,0.07);
}
</style>
