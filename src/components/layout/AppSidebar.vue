<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore }       from '@/stores/ui'
import { useWebSocketStore } from '@/stores/websocket'
import { useAlertsStore }   from '@/stores/alerts'
import { useMetricsStore }  from '@/stores/metrics'
import {
  IconLayoutDashboard, IconBrain, IconSparkles, IconStack2,
  IconCloud, IconBolt, IconWind, IconThermometer,
  IconHistory, IconApi, IconHeartbeat, IconBell,
  IconDroplet, IconAlertTriangle, IconSun, IconMoon
} from '@tabler/icons-vue'

const route   = useRoute()
const ui      = useUIStore()
const wsStore = useWebSocketStore()
const alerts  = useAlertsStore()
const metrics = useMetricsStore()

const nav = [
  { label: 'Panel General',    to: '/',            icon: IconLayoutDashboard },
  { label: 'Cerebro Activo',   to: '/cerebro',     icon: IconBrain },
  { label: 'Decisiones IA',    to: '/decisiones',  icon: IconSparkles },
  { label: 'Capas de la Pared',to: '/capas',       icon: IconStack2 },
  { label: 'Clima y Previsión',to: '/clima',       icon: IconCloud },
  { label: 'Red Eléctrica',    to: '/red',         icon: IconBolt },
  { label: 'Calidad del Aire', to: '/aire',        icon: IconWind },
  { label: 'Confort',          to: '/confort',     icon: IconThermometer },
  { label: 'Histórico',        to: '/historico',   icon: IconHistory },
  { label: 'Log de APIs',      to: '/log',         icon: IconApi },
  { label: 'Salud del Sistema',to: '/salud',       icon: IconHeartbeat },
  { label: 'Alertas',          to: '/alertas',     icon: IconBell },
  { label: 'Agua y Sequía',    to: '/agua',        icon: IconDroplet },
  { label: 'Emergencias',      to: '/emergencias', icon: IconAlertTriangle }
]

const lastEvents = computed(() => wsStore.events.slice(0, 3))

const energySrc = computed(() => metrics.energy_source || { solar_pct: 60, battery_pct: 30, grid_pct: 10 })

function isActive(to) {
  return route.path === to
}
</script>

<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <span class="logo-mark">V</span>
      <div class="logo-text">
        <span class="logo-name">VitalWall</span>
        <span class="logo-sub">POC Dashboard</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <component :is="item.icon" :size="16" stroke-width="1.8" class="nav-icon" />
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.to === '/alertas' && alerts.activeCount > 0" class="nav-badge">
          {{ alerts.activeCount }}
        </span>
      </RouterLink>
    </nav>

    <!-- Cerebro Activo mini-feed -->
    <div class="sidebar-section">
      <div class="section-header">Cerebro Activo</div>
      <div class="mini-feed">
        <div v-for="ev in lastEvents" :key="ev.id" class="mini-event">
          <span class="mini-dot" :class="ev.type.includes('alert') ? 'danger' : 'ok'"></span>
          <span class="mini-msg">{{ ev.message }}</span>
        </div>
        <div v-if="!lastEvents.length" class="mini-empty">Sin eventos recientes</div>
      </div>
    </div>

    <!-- ESG block -->
    <div class="sidebar-section esg-block">
      <div class="section-header">Energía ahora</div>
      <div class="esg-bars">
        <div class="esg-bar-row">
          <span class="esg-label">Solar</span>
          <div class="esg-track">
            <div class="esg-fill solar" :style="{ width: energySrc.solar_pct + '%' }"></div>
          </div>
          <span class="esg-pct">{{ energySrc.solar_pct }}%</span>
        </div>
        <div class="esg-bar-row">
          <span class="esg-label">Bat.</span>
          <div class="esg-track">
            <div class="esg-fill battery" :style="{ width: energySrc.battery_pct + '%' }"></div>
          </div>
          <span class="esg-pct">{{ energySrc.battery_pct }}%</span>
        </div>
        <div class="esg-bar-row">
          <span class="esg-label">Red</span>
          <div class="esg-track">
            <div class="esg-fill grid" :style="{ width: energySrc.grid_pct + '%' }"></div>
          </div>
          <span class="esg-pct">{{ energySrc.grid_pct }}%</span>
        </div>
      </div>
    </div>

    <!-- Dark mode toggle -->
    <div class="sidebar-footer">
      <div class="ws-dot" :class="{ connected: wsStore.connected }">
        <span class="ws-indicator"></span>
        <span class="ws-label">{{ wsStore.connected ? 'En vivo' : 'Desconectado' }}</span>
      </div>
      <button class="theme-toggle" @click="ui.toggleDarkMode()">
        <IconMoon v-if="!ui.darkMode" :size="15" />
        <IconSun  v-else              :size="15" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: sticky;
  top: 0;
  transition: background 0.2s;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border);
}
.logo-mark {
  width: 30px;
  height: 30px;
  background: var(--green);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
}
.logo-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
}
.logo-sub {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 16px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  cursor: pointer;
  text-decoration: none;
}
.nav-item:hover {
  color: var(--text);
  background: var(--border);
}
.nav-item.active {
  color: var(--green);
  border-left-color: var(--green);
  background: rgba(29,158,117,0.09);
}
html.dark .nav-item.active {
  color: var(--green-light);
  border-left-color: var(--green-light);
  background: rgba(93,202,165,0.08);
}
.nav-icon { flex-shrink: 0; opacity: 0.8; }
.nav-item.active .nav-icon { opacity: 1; }
.nav-label { flex: 1; }
.nav-badge {
  min-width: 16px;
  height: 16px;
  background: var(--red);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Sections */
.sidebar-section {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}
.section-header {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

/* Mini feed */
.mini-feed { display: flex; flex-direction: column; gap: 5px; }
.mini-event { display: flex; align-items: flex-start; gap: 6px; }
.mini-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
}
.mini-dot.ok { background: var(--green); box-shadow: 0 0 3px rgba(29,158,117,0.5); }
.mini-dot.danger { background: var(--red); box-shadow: 0 0 3px rgba(226,75,74,0.5); }
.mini-msg { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.mini-empty { font-size: 11px; color: var(--text-muted); font-style: italic; }

/* ESG */
.esg-bars { display: flex; flex-direction: column; gap: 5px; }
.esg-bar-row { display: flex; align-items: center; gap: 6px; }
.esg-label { font-size: 10px; color: var(--text-muted); font-weight: 500; width: 26px; flex-shrink: 0; }
.esg-track { flex: 1; height: 4px; background: var(--border-strong); border-radius: 2px; overflow: hidden; }
.esg-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
.esg-fill.solar   { background: var(--amber); }
.esg-fill.battery { background: var(--green); }
.esg-fill.grid    { background: var(--blue-raw); }
.esg-pct { font-size: 10px; color: var(--text-muted); width: 28px; text-align: right; }

/* Footer */
.sidebar-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ws-dot { display: flex; align-items: center; gap: 6px; }
.ws-indicator {
  width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
}
.ws-dot.connected .ws-indicator {
  background: var(--green);
  box-shadow: 0 0 4px rgba(29,158,117,0.7);
}
.ws-label { font-size: 10px; color: var(--text-muted); font-weight: 500; }
.theme-toggle {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 5px;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
}
.theme-toggle:hover { background: var(--border); color: var(--text); }
</style>
