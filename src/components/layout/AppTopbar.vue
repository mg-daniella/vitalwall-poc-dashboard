<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAlertsStore }    from '@/stores/alerts'
import { useWebSocketStore } from '@/stores/websocket'

const route   = useRoute()
const alerts  = useAlertsStore()
const wsStore = useWebSocketStore()

// ── Site selector ──
const sites = [
  { id: 'hq',           label: 'Cosentino HQ',      sub: 'Barcelona, España'   },
  { id: 'canada',       label: 'Edificio Canadá',    sub: 'Canadá'              },
  { id: 'argelia',      label: 'Edificio Argelia',   sub: 'Argelia'             },
  { id: 'consolidados', label: 'Datos Consolidados', sub: 'Todos los edificios' },
]
const selectedSite = ref(sites[0])
const siteOpen     = ref(false)

function selectSite(s) { selectedSite.value = s; siteOpen.value = false }

const viewMeta = {
  '/':            { title: 'Panel General',     sub: 'Vista unificada del sistema Vital Shell' },
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
  '/emergencias': { title: 'Emergencias',       sub: 'Alertas externas críticas' },
  '/esg':         { title: 'Informe ESG',       sub: 'Medioambiental · Social · Gobernanza' }
}

const current = computed(() => viewMeta[route.path] || { title: 'Dashboard', sub: '' })
const nowStr  = computed(() => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <header class="topbar">

    <!-- Left: page identity -->
    <div class="topbar-left">
      <div class="topbar-title">{{ current.title }}</div>
      <div class="topbar-sub">{{ current.sub }}</div>
    </div>

    <!-- Right: controls -->
    <div class="topbar-right">

      <!-- Site selector -->
      <div class="site-selector" @click="siteOpen = !siteOpen" @blur.capture="siteOpen = false" tabindex="0">
        <button class="site-btn" :class="{ 'site-btn--open': siteOpen }" type="button">
          <i class="ti ti-map-pin site-pin" aria-hidden="true"></i>
          <div class="site-text">
            <span class="site-name">{{ selectedSite.label }}, {{ selectedSite.sub }}</span>
          </div>
          <span class="site-arrow" :class="{ 'site-arrow--up': siteOpen }">&#9660;</span>
        </button>

        <div v-if="siteOpen" class="site-dropdown">
          <div class="site-dropdown-header">Seleccionar edificio</div>
          <div v-for="s in sites" :key="s.id"
               class="site-option"
               :class="{ active: s.id === selectedSite.id }"
               @click.stop="selectSite(s)">
            <div class="site-opt-check">
              <i v-if="s.id === selectedSite.id" class="ti ti-check" aria-hidden="true"></i>
            </div>
            <div>
              <div class="site-opt-name">{{ s.label }}</div>
              <div class="site-opt-sub">{{ s.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="topbar-divider"></div>

      <!-- Live status -->
      <div class="status-pill" :class="wsStore.connected ? 'status-live' : 'status-offline'">
        <span class="status-dot"></span>
        {{ wsStore.connected ? 'En vivo' : 'Offline' }}
      </div>

      <!-- Alerts -->
      <div v-if="alerts.activeCount > 0" class="status-pill status-warn">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        {{ alerts.activeCount }} alertas
      </div>

      <!-- Clock -->
      <div class="topbar-clock">{{ nowStr }}</div>

    </div>
  </header>
</template>

<style scoped>
.topbar {
  padding: 0 30px;
  height: 58px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
  gap: 20px;
}

/* Left */
.topbar-left { min-width: 0; }
.topbar-title {
  font-size: 20px; font-weight: 700; letter-spacing: -0.3px;
  color: var(--text); line-height: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.topbar-sub {
  font-size: 11px; color: var(--text-muted); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Right */
.topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.topbar-divider { width: 1px; height: 24px; background: var(--border-strong); margin: 0 2px; }

/* ── Site selector ── */
.site-selector { position: relative; }

.site-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px 7px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
}
.site-btn:hover,
.site-btn--open { border-color: var(--blue-raw); background: var(--card-alt); }

.site-pin { font-size: 14px; color: var(--blue-raw); flex-shrink: 0; }

.site-text { display: flex; flex-direction: column; }
.site-name { font-size: 12px; font-weight: 600; color: var(--text); }

.site-arrow {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 4px;
  display: inline-block;
  transition: transform 0.2s;
  line-height: 1;
}
.site-arrow--up { transform: rotate(180deg); }

/* Dropdown */
.site-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0;
  min-width: 220px;
  background: var(--card-bg);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  z-index: 300;
  overflow: hidden;
}
.site-dropdown-header {
  padding: 10px 14px 8px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.site-option {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
}
.site-option:last-child { border-bottom: none; }
.site-option:hover { background: var(--card-alt); }
.site-option.active { background: rgba(55,138,221,0.05); }

.site-opt-check {
  width: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--blue-raw); font-size: 13px;
}
.site-opt-name { font-size: 13px; font-weight: 600; color: var(--text); }
.site-option.active .site-opt-name { color: var(--blue-raw); }
.site-opt-sub  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

/* ── Status pills ── */
.status-pill {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600;
  padding: 5px 11px; border-radius: 20px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.status-live {
  color: var(--blue-raw);
  background: rgba(55,138,221,0.08);
  border-color: rgba(55,138,221,0.25);
}
.status-live .status-dot {
  background: var(--blue-raw);
  box-shadow: 0 0 5px rgba(55,138,221,0.6);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.status-offline {
  color: var(--text-muted);
  background: var(--card-alt);
  border-color: var(--border);
}
.status-offline .status-dot { background: var(--text-muted); }
.status-warn {
  color: var(--text-secondary);
  background: var(--card-alt);
  border-color: var(--border-strong);
}

/* Clock */
.topbar-clock {
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  letter-spacing: 0.5px;
  padding: 5px 10px;
  background: var(--card-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
}
</style>
