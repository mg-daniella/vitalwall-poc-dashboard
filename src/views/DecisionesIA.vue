<script setup>
import { ref, computed } from 'vue'
import { useRulesStore }        from '@/stores/rules'
import { useSensorsStore }      from '@/stores/sensors'
import { useEnvironmentStore }  from '@/stores/environment'
import { useMetricsStore }      from '@/stores/metrics'
import StatusDot   from '@/components/ui/StatusDot.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ErrorState  from '@/components/ui/ErrorState.vue'
import InsightBox  from '@/components/ui/InsightBox.vue'
import { useToastsStore }   from '@/stores/toasts'
import { useRelativeTime } from '@/composables/useRelativeTime'

const toasts = useToastsStore()
const { relativeTime } = useRelativeTime()

const rules   = useRulesStore()
const sensors = useSensorsStore()
const env     = useEnvironmentStore()
const metrics = useMetricsStore()

function envVal(key) { return env.current?.[key]?.value ?? '—' }

const buildingMetrics = computed(() => [
  { icon: 'ti-battery-2',    label: 'Nív. Batería',     value: sensors.battery_level?.value ?? '—', unit: '%'  },
  { icon: 'ti-thermometer',  label: 'Temp. Int.',        value: sensors.temperature?.value   ?? '—', unit: '°C' },
  { icon: 'ti-thermometer',  label: 'Temp. Ext.',        value: envVal('ext_temperature'),            unit: '°C' },
  { icon: 'ti-bolt',         label: 'Energía Generada',  value: metrics.energy_generated_today?.value ?? '38.4', unit: 'kWh' },
  { icon: 'ti-droplet',      label: 'Agua Captada',      value: metrics.water_harvested_today?.value  ?? '142',  unit: 'L'   },
])
const activeTab = ref('active')
const tabs = [
  { id: 'active',    label: 'Activas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' }
]

const displayRules = computed(() => {
  if (activeTab.value === 'active')    return rules.activeRules
  if (activeTab.value === 'pending')   return rules.pendingRules
  if (activeTab.value === 'completed') return rules.completedRules
  return []
})

// Override modal
const showModal    = ref(false)
const selectedRule = ref(null)
const overrideForm = ref({ descripcion: '', capa: '', duracion: 60, condicion: '', estado: 'active', motivo: '' })
const capas = ['ventilacion','proteccion_solar','energia','agua','confort_termico','iluminacion']

function openOverride(rule) {
  selectedRule.value = rule
  overrideForm.value = { descripcion: rule.description, capa: rule.layer || '', duracion: 60, condicion: '', estado: rule.status, motivo: '' }
  showModal.value = true
}

async function saveOverride() {
  if (!selectedRule.value) return
  if (!overrideForm.value.motivo.trim()) {
    toasts.error('El motivo del override es obligatorio')
    return
  }
  if (!overrideForm.value.duracion || overrideForm.value.duracion <= 0) {
    toasts.error('La duración debe ser mayor que 0')
    return
  }
  try {
    await rules.overrideRule(selectedRule.value.id, { ...overrideForm.value })
    toasts.success('Override aplicado correctamente')
    showModal.value = false
  } catch (err) {
    toasts.error('No se pudo guardar el override: ' + (err.message || 'error desconocido'))
  }
}

async function toggleRule(rule) {
  const newStatus = rule.status === 'active' ? 'pending' : 'active'
  await rules.toggleRule(rule.id, newStatus)
  if (rules.actionError?.id === rule.id) {
    toasts.error(rules.actionError.message)
  }
}

const statusMeta = {
  active:    { label: 'Activa',     icon: 'ti-player-play',  accent: 'var(--blue-raw)'   },
  pending:   { label: 'Pendiente',  icon: 'ti-clock',        accent: 'var(--text-muted)' },
  completed: { label: 'Completada', icon: 'ti-circle-check', accent: 'var(--text-muted)' }
}

const lastUpdated = computed(() => {
  const t = new Date()
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`
})

const summaryStats = computed(() => [
  { label: 'Pendientes',      value: rules.pendingRules.length,   icon: 'ti-clock'        },
  { label: 'Completadas hoy', value: rules.completedRules.length, icon: 'ti-circle-check' },
])

function durationPct(rule) {
  if (!rule.triggered_at || !rule.duration) return 0
  const elapsed = (Date.now() - new Date(rule.triggered_at).getTime()) / 60000
  return Math.min(Math.round((elapsed / rule.duration) * 100), 100)
}

// ── 7-day plan ──
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

const planTemplate = [
  {
    threat: { label: 'Ola de calor', icon: 'ti-sun-high', level: 'critical' },
    reason: 'Ola de calor prevista con máximas de 41°C. Alta probabilidad de estrés térmico en fachadas sur y oeste.',
    actions: [
      { icon: 'ti-wind',          layer: 'Ventilación',      text: 'Activar ventilación cruzada nocturna (22:00–06:00)', priority: 'high' },
      { icon: 'ti-sun',           layer: 'Protección Solar', text: 'Desplegar lamas en fachada sur y oeste desde 07:30', priority: 'high' },
      { icon: 'ti-droplet',       layer: 'Agua Gris',        text: 'Reducir consumo hídrico no esencial en un 20%',      priority: 'med'  },
    ]
  },
  {
    threat: { label: 'Radiación alta', icon: 'ti-uv-index', level: 'high' },
    reason: 'Índice UV previsto de 9 (muy alto). Sin cobertura nubosa — captación solar al máximo posible.',
    actions: [
      { icon: 'ti-sun',           layer: 'Energía Solar',    text: 'Maximizar captación fotovoltaica — pico 11:00–15:00', priority: 'high' },
      { icon: 'ti-temperature',   layer: 'Confort Térmico',  text: 'Pre-enfriar planta 3 antes de ocupación (07:00)',    priority: 'high' },
      { icon: 'ti-shield',        layer: 'Protección Solar', text: 'Mantener lamas al 80% en horas centrales',           priority: 'med'  },
    ]
  },
  {
    threat: { label: 'Viento fuerte', icon: 'ti-wind', level: 'med' },
    reason: 'Ráfagas de Levante previstas de hasta 70 km/h. Riesgo de vibración en paneles y pérdida de eficiencia en ventilación.',
    actions: [
      { icon: 'ti-wind',          layer: 'Ventilación',      text: 'Reorientar entradas de aire — evitar fachada norte', priority: 'high' },
      { icon: 'ti-bolt',          layer: 'Energía Solar',    text: 'Asegurar paneles ante ráfagas >60 km/h',             priority: 'high' },
      { icon: 'ti-building',      layer: 'Confort Térmico',  text: 'Activar modo pasivo en plantas 2 y 3',               priority: 'low'  },
    ]
  },
  {
    threat: { label: 'Estable',      icon: 'ti-circle-check', level: 'ok' },
    reason: 'Condiciones meteorológicas favorables. Ventana idónea para mantenimiento y optimización de sistemas.',
    actions: [
      { icon: 'ti-leaf',          layer: 'Energía Solar',    text: 'Optimizar excedente solar — volcar a red (14:00)',   priority: 'med'  },
      { icon: 'ti-droplet',       layer: 'Agua Gris',        text: 'Ciclo de recarga depósito de agua gris',             priority: 'low'  },
      { icon: 'ti-settings',      layer: 'Confort Térmico',  text: 'Calibración de sensores de planta 1',               priority: 'low'  },
    ]
  },
  {
    threat: { label: 'Lluvia leve',  icon: 'ti-cloud-rain', level: 'low' },
    reason: 'Precipitaciones de 8–12 mm esperadas. Oportunidad de captación pluvial y enfriamiento evaporativo.',
    actions: [
      { icon: 'ti-droplet',       layer: 'Agua Gris',        text: 'Activar captación de agua pluvial en cubierta',      priority: 'high' },
      { icon: 'ti-sun',           layer: 'Protección Solar', text: 'Replegar lamas — aprovechar luz difusa',             priority: 'low'  },
      { icon: 'ti-wind',          layer: 'Ventilación',      text: 'Aprovechar humedad exterior para enfriamiento evap.',priority: 'med'  },
    ]
  },
  {
    threat: { label: 'Radiación alta', icon: 'ti-uv-index', level: 'high' },
    reason: 'Segundo día consecutivo de alta irradiación solar. Acumulación térmica en fachada sur puede alcanzar 48°C.',
    actions: [
      { icon: 'ti-sun',           layer: 'Energía Solar',    text: 'Segunda jornada de alta captación — sin nubes',     priority: 'high' },
      { icon: 'ti-temperature',   layer: 'Confort Térmico',  text: 'Reforzar ventilación mecánica en planta 2',         priority: 'med'  },
      { icon: 'ti-shield',        layer: 'Protección Solar', text: 'Protocolo de sombreado total fachada sur 12–17h',   priority: 'high' },
    ]
  },
  {
    threat: { label: 'Estable',      icon: 'ti-circle-check', level: 'ok' },
    reason: 'Fin de semana con condiciones neutras. Se aprovecha para tareas de revisión y actualización del modelo predictivo.',
    actions: [
      { icon: 'ti-settings',      layer: 'Ventilación',      text: 'Mantenimiento preventivo de actuadores de lamas',   priority: 'med'  },
      { icon: 'ti-leaf',          layer: 'Agua Gris',        text: 'Reporte semanal de eficiencia hídrica',             priority: 'low'  },
      { icon: 'ti-cpu',           layer: 'Confort Térmico',  text: 'Actualización de modelo predictivo de temperatura', priority: 'low'  },
    ]
  },
]

const weekPlan = computed(() => {
  const today = new Date()
  return planTemplate.map((tpl, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      dayName:  DAY_NAMES[d.getDay()],
      date:     `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
      isToday:  i === 0,
      ...tpl
    }
  })
})

const threatStyle = {
  critical: { color: 'var(--blue-raw)',     bg: 'rgba(55,138,221,0.10)' },
  high:     { color: 'var(--blue-raw)',     bg: 'rgba(55,138,221,0.07)' },
  med:      { color: 'var(--text-secondary)', bg: 'var(--card-alt)'    },
  low:      { color: 'var(--text-muted)',   bg: 'var(--card-alt)'      },
  ok:       { color: 'var(--blue-raw)',     bg: 'rgba(55,138,221,0.06)'},
}

const priorityDot = { high: 'var(--blue-raw)', med: 'var(--text-secondary)', low: 'var(--border-strong)' }
</script>

<template>
  <div class="view-inner decisiones">

    <!-- Live summary bar -->
    <div class="summary-bar">

      <!-- Top row: rule counts + InsightBox -->
      <div class="summary-top">
        <div class="summary-hero">
          <div class="hero-pulse-wrap">
            <span class="hero-live-dot"></span>
            <span class="summary-hero-num">{{ rules.activeRules.length }}</span>
          </div>
          <div class="summary-hero-label">reglas activas</div>
        </div>

        <div class="summary-sep"></div>

        <div v-for="s in summaryStats" :key="s.label" class="summary-chip">
          <i :class="`ti ${s.icon} summary-icon`" aria-hidden="true"></i>
          <span class="summary-value">{{ s.value }}</span>
          <span class="summary-label">{{ s.label }}</span>
        </div>

        <div class="summary-sep"></div>

        <!-- Inline InsightBox -->
        <div class="summary-insight">
          <div class="summary-insight-label">
            <i class="ti ti-sparkles" aria-hidden="true"></i>
            IA Insight
          </div>
          <div class="summary-insight-text">
            El sistema gestiona activamente ventilación y confort térmico. Las reglas completadas han reducido el consumo un 12% respecto a ayer.
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="summary-row-sep"></div>

      <!-- Bottom row: building metrics -->
      <div class="summary-bottom">
        <div class="bm-legend">
          <i class="ti ti-building bm-legend-icon" aria-hidden="true"></i>
          Estado del Edificio
        </div>
        <div class="bm-strip">
          <div v-for="m in buildingMetrics" :key="m.label" class="bm-metric">
            <i :class="`ti ${m.icon} bm-icon`" aria-hidden="true"></i>
            <div class="bm-body">
              <span class="bm-label">{{ m.label }}</span>
              <span class="bm-value">{{ m.value }}<span class="bm-unit">{{ m.unit }}</span></span>
            </div>
          </div>
        </div>
        <div class="summary-hint">
          <i class="ti ti-clock" aria-hidden="true"></i>
          Actualizado {{ lastUpdated }}
        </div>
      </div>

    </div>


    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs" :key="tab.id"
        class="tab-btn" :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="tab-count">
          {{ tab.id === 'active' ? rules.activeRules.length : tab.id === 'pending' ? rules.pendingRules.length : rules.completedRules.length }}
        </span>
      </button>
    </div>

    <!-- Rules list -->
    <div class="rules-list">
      <div v-if="rules.loading" class="loading-state">
        <i class="ti ti-loader-2 loading-icon" aria-hidden="true"></i>
        Cargando reglas…
      </div>
      <ErrorState
        v-else-if="rules.error"
        :message="rules.error.message"
        :status="rules.error.status"
        :retry-exhausted="rules.error.retryExhausted"
        :retrying="rules.retrying"
        @retry="rules.retry()"
      />
      <div v-else-if="!displayRules.length" class="empty-state">
        <i class="ti ti-circle-check empty-icon" aria-hidden="true"></i>
        <span class="empty-title">Sin reglas {{ activeTab === 'active' ? 'activas' : activeTab === 'pending' ? 'pendientes' : 'completadas' }}</span>
        <span class="empty-sub">{{ activeTab === 'active' ? 'El sistema está en modo pasivo. No hay decisiones en curso.' : activeTab === 'pending' ? 'No hay reglas en espera de activación.' : 'Aún no se han completado reglas en esta sesión.' }}</span>
      </div>

      <div v-for="rule in displayRules" :key="rule.id" class="rule-card"
           :style="{ '--accent': statusMeta[rule.status]?.accent || 'var(--text-muted)' }">

        <!-- Left accent stripe + icon -->
        <div class="rule-stripe" :class="{ 'stripe-pulse': rule.status === 'active' }">
          <i :class="`ti ${statusMeta[rule.status]?.icon || 'ti-circle'} stripe-icon`" aria-hidden="true"></i>
        </div>

        <!-- Main content -->
        <div class="rule-body">
          <div class="rule-top">
            <span class="rule-title">{{ rule.title }}</span>
            <span class="rule-status-label">{{ statusMeta[rule.status]?.label }}</span>
          </div>

          <div class="rule-desc">{{ rule.description }}</div>

          <div class="rule-meta">
            <span v-if="rule.layer" class="meta-tag">
              <i class="ti ti-stack-2" aria-hidden="true"></i>{{ rule.layer }}
            </span>
            <span v-if="rule.source" class="meta-tag">
              <i class="ti ti-cpu" aria-hidden="true"></i>{{ rule.source }}
            </span>
            <span v-if="rule.duration" class="meta-tag">
              <i class="ti ti-hourglass" aria-hidden="true"></i>{{ rule.duration }} min
            </span>
            <span class="rule-time">
              <i class="ti ti-clock" aria-hidden="true"></i>{{ relativeTime(rule.triggered_at) }}
            </span>
          </div>

          <!-- Duration progress bar -->
          <div v-if="rule.duration && rule.status !== 'completed'" class="duration-bar-wrap">
            <div class="duration-bar-track">
              <div class="duration-bar-fill" :style="{ width: durationPct(rule) + '%' }"></div>
            </div>
            <span class="duration-pct">{{ durationPct(rule) }}%</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="rule-actions" v-if="activeTab !== 'completed'">
          <button class="action-btn primary-action" @click="toggleRule(rule)">
            <i :class="`ti ${rule.status === 'active' ? 'ti-player-pause' : 'ti-player-play'}`" aria-hidden="true"></i>
            {{ rule.status === 'active' ? 'Pausar' : 'Activar' }}
          </button>
          <button class="action-btn ghost-action" @click="openOverride(rule)">
            <i class="ti ti-edit" aria-hidden="true"></i>
            Override
          </button>
        </div>

      </div>
    </div>

    <!-- ══ 7-day plan ══ -->
    <div class="plan-section card">
      <div class="plan-header">
        <div class="plan-title-block">
          <i class="ti ti-calendar-week plan-title-icon" aria-hidden="true"></i>
          <span class="plan-title">Plan de Acción — Próximos 7 días</span>
        </div>
        <span class="plan-subtitle">Decisiones predictivas del sistema para protección del edificio</span>
      </div>

      <div class="plan-grid">
        <div v-for="day in weekPlan" :key="day.date"
             class="plan-day-card card"
             :class="{ 'plan-today': day.isToday }">

          <!-- Day header -->
          <div class="plan-day-header">
            <div class="plan-day-name">{{ day.isToday ? 'Hoy' : day.dayName }}</div>
            <div class="plan-day-date">{{ day.date }}</div>
          </div>

          <!-- Threat badge -->
          <div class="plan-threat"
               :style="{ color: threatStyle[day.threat.level].color, background: threatStyle[day.threat.level].bg }">
            <i :class="`ti ${day.threat.icon}`" aria-hidden="true"></i>
            {{ day.threat.label }}
          </div>

          <!-- Justification -->
          <div class="plan-reason">{{ day.reason }}</div>

          <!-- Actions -->
          <div class="plan-actions">
            <div v-for="(action, ai) in day.actions" :key="ai" class="plan-action">
              <span class="plan-dot" :style="{ background: priorityDot[action.priority] }"></span>
              <div class="plan-action-body">
                <span class="plan-layer">
                  <i :class="`ti ${action.icon}`" aria-hidden="true"></i>
                  {{ action.layer }}
                </span>
                <span class="plan-action-text">{{ action.text }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Override modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title-block">
              <i class="ti ti-edit modal-title-icon" aria-hidden="true"></i>
              <span class="modal-title">Override Manual</span>
            </div>
            <button class="modal-close" @click="showModal = false"><i class="ti ti-x" aria-hidden="true"></i></button>
          </div>
          <div class="modal-audit">
            <i class="ti ti-shield-lock" aria-hidden="true"></i>
            Este cambio quedará registrado en el log de auditoría del sistema.
          </div>
          <div class="modal-body">
            <label class="form-label">Descripción
              <textarea v-model="overrideForm.descripcion" class="form-input" rows="2"></textarea>
            </label>
            <div class="form-row">
              <label class="form-label">Capa
                <select v-model="overrideForm.capa" class="form-input">
                  <option v-for="c in capas" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <label class="form-label">Duración (min)
                <input v-model.number="overrideForm.duracion" type="number" class="form-input" />
              </label>
            </div>
            <label class="form-label">Condición de activación
              <input v-model="overrideForm.condicion" type="text" class="form-input" placeholder="ej: temp > 32°C" />
            </label>
            <label class="form-label">Estado
              <select v-model="overrideForm.estado" class="form-input">
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="pending">Pendiente</option>
              </select>
            </label>
            <label class="form-label required">Motivo del override
              <textarea v-model="overrideForm.motivo" class="form-input" rows="2" placeholder="Explica el motivo del cambio manual…"></textarea>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showModal = false">Cancelar</button>
            <button class="btn-save" @click="saveOverride">
              <i class="ti ti-check" aria-hidden="true"></i>
              Guardar override
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.decisiones { display: flex; flex-direction: column; gap: 14px; }

/* ── Summary bar ── */
.summary-bar {
  display: flex; flex-direction: column; gap: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.summary-top {
  display: flex; align-items: center; gap: 20px;
  padding: 16px 24px;
}

.summary-row-sep { height: 1px; background: var(--border); }

.summary-bottom {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 24px;
  background: var(--card-alt);
}

/* Hero number */
.summary-hero { display: flex; flex-direction: column; gap: 2px; }
.hero-pulse-wrap { display: flex; align-items: center; gap: 8px; }
.hero-live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--blue-raw);
  box-shadow: 0 0 6px rgba(55,138,221,0.5);
  animation: pulse-dot 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.25} }
.summary-hero-num { font-size: 44px; font-weight: 700; letter-spacing: -2px; color: var(--text); line-height: 1; }
.summary-hero-label { font-size: 11px; font-weight: 500; color: var(--text-muted); margin-left: 16px; }

.summary-chip { display: flex; align-items: center; gap: 7px; }
.summary-icon { font-size: 15px; color: var(--blue-raw); }
.summary-value { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.summary-label { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.summary-sep { width: 1px; height: 36px; background: var(--border-strong); margin: 0 4px; flex-shrink: 0; }

.summary-hint {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: var(--text-muted); font-weight: 500;
  margin-left: auto; flex-shrink: 0; white-space: nowrap;
  letter-spacing: 0.2px;
}
.summary-hint .ti { font-size: 11px; }

/* Inline InsightBox in summary-top */
.summary-insight {
  flex: 1;
  border-left: 2px solid var(--blue-raw);
  padding: 4px 0 4px 14px;
  display: flex; flex-direction: column; gap: 4px;
  min-width: 0;
}
.summary-insight-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--blue-raw);
}
.summary-insight-label .ti { font-size: 11px; }
.summary-insight-text {
  font-size: 12px; color: var(--text-secondary);
  line-height: 1.55;
}

/* Building metrics legend label */
.bm-legend {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted);
  flex-shrink: 0; white-space: nowrap;
}
.bm-legend-icon { font-size: 12px; }

/* Building metrics strip */
.bm-strip {
  display: flex; align-items: center;
  flex: 1;
}
.bm-metric {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 14px;
  border-right: 1px solid var(--border-strong);
  flex: 1;
}
.bm-metric:first-child { padding-left: 0; }
.bm-metric:last-child { border-right: none; }
.bm-icon { font-size: 14px; color: var(--blue-raw); flex-shrink: 0; }
.bm-body { display: flex; flex-direction: column; line-height: 1.25; }
.bm-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.bm-value { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }
.bm-unit { font-size: 10px; font-weight: 400; color: var(--text-secondary); margin-left: 1px; }

/* ── Tabs ── */
.tabs-bar {
  display: inline-flex;
  background: var(--card-alt);
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
  align-self: flex-start;
}
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 18px;
  font-size: 12px; font-weight: 600;
  color: var(--text-muted);
  border-radius: 7px;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
  cursor: pointer;
  white-space: nowrap;
}
.tab-btn.active {
  background: var(--card-bg);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px var(--border);
}
.tab-btn:hover:not(.active) { color: var(--text); }
.tab-count {
  font-size: 10px; font-weight: 700;
  background: var(--border);
  color: var(--text-muted);
  padding: 1px 6px; border-radius: 10px;
}
.tab-btn.active .tab-count { background: rgba(55,138,221,0.12); color: var(--blue-raw); }

/* ── Rules list ── */
.rules-list { display: flex; flex-direction: column; gap: 8px; }

.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 40px; color: var(--text-muted); font-size: 13px;
}
.loading-icon { font-size: 16px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 44px 20px; text-align: center;
}
.empty-icon { font-size: 32px; color: var(--border-strong); margin-bottom: 4px; }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.empty-sub { font-size: 12px; color: var(--text-muted); max-width: 340px; line-height: 1.6; }

.rule-card {
  display: flex; align-items: stretch;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.rule-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

/* Left accent stripe */
.rule-stripe {
  width: 40px; flex-shrink: 0;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-right: 3px solid var(--accent);
  display: flex; align-items: center; justify-content: center;
}
.stripe-icon { font-size: 14px; color: var(--accent); }
.stripe-pulse .stripe-icon { animation: pulse-dot 2s infinite; }

/* Duration progress bar */
.duration-bar-wrap { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.duration-bar-track { flex: 1; height: 4px; background: var(--card-alt); border-radius: 2px; }
.duration-bar-fill { height: 100%; background: var(--blue-raw); border-radius: 2px; opacity: 0.75; transition: width 0.4s; }
.duration-pct { font-size: 10px; color: var(--text-muted); width: 28px; text-align: right; flex-shrink: 0; }

/* Rule body */
.rule-body { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.rule-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.rule-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.3; }
.rule-status-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--accent); flex-shrink: 0;
}

.rule-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.55; }

.rule-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 2px; }
.meta-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 500; color: var(--text-muted);
  background: var(--card-alt); border-radius: 4px; padding: 2px 7px;
}
.meta-tag .ti { font-size: 10px; }
.rule-time {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; color: var(--text-muted); margin-left: auto;
}
.rule-time .ti { font-size: 10px; }

/* Actions */
.rule-actions {
  display: flex; flex-direction: column; justify-content: center; gap: 6px;
  padding: 12px 14px;
  border-left: 1px solid var(--border);
  flex-shrink: 0;
}
.action-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 11px; font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s;
  cursor: pointer;
}
.primary-action {
  background: var(--blue-raw); color: #fff; border: none;
}
.primary-action:hover { opacity: 0.88; }
.ghost-action {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
}
.ghost-action:hover { border-color: var(--blue-raw); color: var(--blue-raw); }

/* ── 7-day plan ── */
.plan-section { display: flex; flex-direction: column; gap: 16px; padding: 20px 22px; }

.plan-header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.plan-title-block { display: flex; align-items: center; gap: 8px; }
.plan-title-icon { font-size: 16px; color: var(--blue-raw); }
.plan-title { font-size: 13px; font-weight: 700; color: var(--text); }
.plan-subtitle { font-size: 11px; color: var(--text-muted); }

.plan-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.plan-day-card {
  padding: 14px 12px;
  display: flex; flex-direction: column; gap: 10px;
  border: 1px solid var(--border);
  transition: box-shadow 0.15s;
}
.plan-day-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.plan-today {
  border-color: rgba(55,138,221,0.35);
  box-shadow: 0 0 0 1px rgba(55,138,221,0.2), 0 2px 12px rgba(55,138,221,0.08);
}

.plan-day-header { display: flex; flex-direction: column; gap: 2px; }
.plan-day-name { font-size: 11px; font-weight: 700; color: var(--text); text-transform: uppercase; letter-spacing: 0.5px; }
.plan-today .plan-day-name { color: var(--blue-raw); }
.plan-day-date { font-size: 10px; color: var(--text-muted); }

.plan-threat {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600;
  padding: 4px 8px; border-radius: 20px;
  width: fit-content;
}
.plan-threat .ti { font-size: 11px; }

.plan-reason {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  line-height: 1.55;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.plan-actions { display: flex; flex-direction: column; gap: 8px; }
.plan-action { display: flex; align-items: flex-start; gap: 7px; }
.plan-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }

.plan-action-body { display: flex; flex-direction: column; gap: 2px; }
.plan-layer {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--blue-raw);
}
.plan-layer .ti { font-size: 9px; }
.plan-action-text { font-size: 10px; color: var(--text-secondary); line-height: 1.5; }

@media (max-width: 1100px) {
  .plan-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 700px) {
  .plan-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--card-bg);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
.modal-title-block { display: flex; align-items: center; gap: 8px; }
.modal-title-icon { font-size: 16px; color: var(--blue-raw); }
.modal-title { font-size: 14px; font-weight: 700; color: var(--text); }
.modal-close { font-size: 16px; color: var(--text-muted); padding: 4px; cursor: pointer; }
.modal-close:hover { color: var(--text); }
.modal-audit {
  display: flex; align-items: center; gap: 8px;
  background: rgba(55,138,221,0.07);
  border-bottom: 1px solid rgba(55,138,221,0.15);
  padding: 10px 22px;
  font-size: 11px; font-weight: 500;
  color: var(--blue-raw);
}
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
  color: var(--text-muted); display: flex; flex-direction: column; gap: 5px;
}
.form-label.required::after { content: ' *'; color: var(--blue-raw); }
.form-input {
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 5px;
  padding: 8px 10px;
  font-size: 13px; color: var(--text);
  font-family: var(--font);
  resize: vertical;
  transition: border-color 0.15s;
}
.form-input:focus { outline: none; border-color: var(--blue-raw); }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
}
.btn-cancel {
  padding: 8px 18px; border-radius: 5px;
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--border-strong);
  cursor: pointer;
}
.btn-cancel:hover { border-color: var(--text-muted); color: var(--text); }
.btn-save {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 5px;
  font-size: 12px; font-weight: 600;
  background: var(--blue-raw); color: #fff; border: none;
  cursor: pointer;
}
.btn-save:hover { opacity: 0.88; }
</style>
