<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore }        from '@/stores/ui'
import { useWebSocketStore } from '@/stores/websocket'
import { useAlertsStore }    from '@/stores/alerts'
import { useMetricsStore }   from '@/stores/metrics'
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
  { label: 'Panel General',     to: '/',            icon: IconLayoutDashboard },
  { label: 'Cerebro Activo',    to: '/cerebro',     icon: IconBrain },
  { label: 'Decisiones IA',     to: '/decisiones',  icon: IconSparkles },
  { label: 'Capas de la Pared', to: '/capas',       icon: IconStack2 },
  { label: 'Clima y Previsión', to: '/clima',       icon: IconCloud },
  { label: 'Red Eléctrica',     to: '/red',         icon: IconBolt },
  { label: 'Calidad del Aire',  to: '/aire',        icon: IconWind },
  { label: 'Confort',           to: '/confort',     icon: IconThermometer },
  { label: 'Histórico',         to: '/historico',   icon: IconHistory },
  { label: 'Log de APIs',       to: '/log',         icon: IconApi },
  { label: 'Salud del Sistema', to: '/salud',       icon: IconHeartbeat },
  { label: 'Alertas',           to: '/alertas',     icon: IconBell },
  { label: 'Agua y Sequía',     to: '/agua',        icon: IconDroplet },
  { label: 'Emergencias',       to: '/emergencias', icon: IconAlertTriangle }
]

const lastEvents = computed(() => wsStore.events.slice(0, 3))
const energySrc  = computed(() => metrics.energy_source || { solar_pct: 60, battery_pct: 30, grid_pct: 10 })

function isActive(to) { return route.path === to }
</script>

<template>
  <aside class="sidebar">

    <!-- Brand -->
    <div class="brand">
      <div class="brand-name">VitalWall</div>
      <div class="brand-sub">POC Dashboard</div>
    </div>

    <!-- Live indicator -->
    <div class="live-indicator">
      <span class="live-dot"></span>
      <span class="live-text">{{ wsStore.connected ? 'Sistema en vivo' : 'Desconectado' }}</span>
    </div>

    <!-- Main nav -->
    <div class="section">
      <div class="section-label">Vistas</div>
    </div>
    <nav>
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <component :is="item.icon" :size="15" stroke-width="1.8" />
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.to === '/alertas' && alerts.activeCount > 0" class="nav-badge badge-red">
          {{ alerts.activeCount }}
        </span>
      </RouterLink>
    </nav>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Cerebro Activo mini-feed -->
    <div class="cerebro-panel">
      <div class="cerebro-header">
        <span class="live-dot" style="width:5px;height:5px;"></span>
        <span class="cerebro-label">Cerebro Activo</span>
      </div>
      <template v-if="lastEvents.length">
        <div v-for="ev in lastEvents" :key="ev.id" class="cerebro-event">
          <span class="ev-dot" :style="{ background: ev.type.includes('alert') ? 'var(--red)' : 'var(--green)' }"></span>
          <div>
            <div class="ev-text">{{ ev.message }}</div>
            <div class="ev-time">{{ new Date(ev.time).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }) }}</div>
          </div>
        </div>
      </template>
      <div v-else class="ev-text" style="color:var(--text-muted);font-style:italic;">Sin eventos recientes</div>
    </div>

    <!-- ESG energy block -->
    <div class="esg-block">
      <div class="esg-label">Energía ahora</div>
      <div class="esg-bars">
        <div class="esg-bar-row">
          <span class="esg-bar-name">Solar</span>
          <div class="esg-track"><div class="esg-fill" style="background:var(--amber)" :style="{ width: energySrc.solar_pct + '%' }"></div></div>
          <span class="esg-pct">{{ energySrc.solar_pct }}%</span>
        </div>
        <div class="esg-bar-row">
          <span class="esg-bar-name">Bat.</span>
          <div class="esg-track"><div class="esg-fill" style="background:var(--green)" :style="{ width: energySrc.battery_pct + '%' }"></div></div>
          <span class="esg-pct">{{ energySrc.battery_pct }}%</span>
        </div>
        <div class="esg-bar-row">
          <span class="esg-bar-name">Red</span>
          <div class="esg-track"><div class="esg-fill" style="background:var(--blue-raw)" :style="{ width: energySrc.grid_pct + '%' }"></div></div>
          <span class="esg-pct">{{ energySrc.grid_pct }}%</span>
        </div>
      </div>
    </div>

    <!-- Footer: dark mode toggle -->
    <div class="sb-footer">
      <div class="toggle-track" @click="ui.toggleDarkMode()">
        <div class="toggle-thumb"></div>
      </div>
      <span class="toggle-label">{{ ui.darkMode ? 'Dark' : 'Light' }}</span>
      <component :is="ui.darkMode ? IconSun : IconMoon" :size="13" style="color:var(--text-muted);margin-left:auto;" />
    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: thin;
}

/* Brand */
.brand { padding: 18px 20px 14px; border-bottom: 1px solid var(--border-strong); }
.brand-name {
  font-size: 21px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--text); line-height: 1;
}
.brand-sub {
  font-size: 11px; font-weight: 500; letter-spacing: 2px;
  text-transform: uppercase; color: var(--text-muted); margin-top: 3px;
}

/* Live indicator */
.live-indicator {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 20px; border-bottom: 1px solid var(--border);
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 5px #1D9E75;
  animation: blink 2s infinite; flex-shrink: 0;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
.live-text { font-size: 11px; font-weight: 400; letter-spacing: 0.3px; color: var(--text-muted); }

/* Section labels */
.section { padding: 14px 20px 4px; }
.section-label {
  font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px;
}

/* Nav items */
.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 18px; cursor: pointer;
  border-left: 2px solid transparent;
  color: var(--text-secondary);
  text-decoration: none;
}
.nav-item:hover { background: rgba(0,0,0,0.03); color: var(--text); }
.nav-item.active {
  background: rgba(29,158,117,0.09);
  border-left-color: var(--green);
  padding-left: 16px;
  color: var(--text);
}
html.dark .nav-item.active { background: rgba(93,202,165,0.08); border-left-color: var(--green-light); }
.nav-label {
  font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
  text-transform: uppercase; flex: 1;
}

/* Badges */
.nav-badge {
  margin-left: auto; font-size: 10px; font-weight: 600;
  letter-spacing: 0.3px; text-transform: uppercase;
  padding: 2px 6px; border-radius: 3px; flex-shrink: 0;
}
.badge-red { background: rgba(226,75,74,0.14); color: var(--red); }

/* Divider */
.divider { height: 1px; background: var(--border-strong); margin: 8px 0; }

/* Cerebro panel */
.cerebro-panel {
  margin: 0 12px 8px;
  background: rgba(29,158,117,0.07);
  border: 1px solid rgba(29,158,117,0.18);
  border-radius: 5px;
  padding: 10px 12px;
}
.cerebro-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.cerebro-label {
  font-size: 9px; font-weight: 600; letter-spacing: 1px;
  text-transform: uppercase; color: var(--green-light);
}
.cerebro-event {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 5px 0; border-bottom: 1px solid rgba(29,158,117,0.1);
}
.cerebro-event:last-child { border-bottom: none; padding-bottom: 0; }
.ev-dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.ev-text { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.ev-time {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px;
}

/* ESG block */
.esg-block { margin: 4px 12px 8px; }
.esg-label {
  font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text-muted);
  margin-bottom: 6px; padding: 0 8px;
}
.esg-bars { display: flex; flex-direction: column; gap: 5px; padding: 0 4px; }
.esg-bar-row { display: flex; align-items: center; gap: 7px; }
.esg-bar-name { font-size: 10px; color: var(--text-muted); font-weight: 500; width: 28px; flex-shrink: 0; }
.esg-track { flex: 1; height: 4px; background: var(--border-strong); border-radius: 2px; overflow: hidden; }
.esg-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
.esg-pct { font-size: 10px; color: var(--text-muted); width: 28px; text-align: right; }

/* Footer */
.sb-footer {
  padding: 12px 20px; border-top: 1px solid var(--border-strong);
  margin-top: auto; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.toggle-track {
  width: 32px; height: 17px; border-radius: 9px;
  border: 1px solid var(--border-strong); background: rgba(0,0,0,0.12);
  position: relative; cursor: pointer; flex-shrink: 0;
}
html.dark .toggle-track { background: var(--green); border-color: var(--green); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 11px; height: 11px; border-radius: 50%;
  background: white; transition: left 0.2s;
}
html.dark .toggle-thumb { left: 17px; }
.toggle-label {
  font-size: 10px; font-weight: 500; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--text-muted);
}
</style>
