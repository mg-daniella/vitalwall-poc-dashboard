<script setup>
import { computed } from 'vue'
import { useSensorsStore }      from '@/stores/sensors'
import { useEnvironmentStore }  from '@/stores/environment'
import { useMetricsStore }      from '@/stores/metrics'
import { useRulesStore }        from '@/stores/rules'
import { useSystemHealthStore } from '@/stores/systemHealth'
import InsightBox   from '@/components/ui/InsightBox.vue'
import StatusDot    from '@/components/ui/StatusDot.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ErrorState   from '@/components/ui/ErrorState.vue'
import { useRelativeTime } from '@/composables/useRelativeTime'

const sensors = useSensorsStore()
const env     = useEnvironmentStore()
const metrics = useMetricsStore()
const rules   = useRulesStore()
const health  = useSystemHealthStore()
const { relativeTime } = useRelativeTime()

// ── KPI trio ──
const estabilidad = computed(() => metrics.comfort_score?.value ?? 85)
const estabilidadOk = computed(() => estabilidad.value >= 95)

const captacion = computed(() => metrics.water_harvested_today?.value ?? null)
const captacionOk = computed(() => captacion.value != null && captacion.value > 20)

const energySrc = computed(() => metrics.energy_source || {})
const balanceNeto = computed(() => {
  const { solar_pct = 0, battery_pct = 0, grid_pct = 0 } = energySrc.value
  return Math.round(solar_pct + battery_pct - grid_pct)
})
const balanceOk = computed(() => balanceNeto.value >= 0)

function kpiBarPct(value, max) { return Math.min(Math.round((value / max) * 100), 100) }
function targetPct(target, max) { return Math.min(Math.round((target / max) * 100), 100) }

// ── Rules ──
const statusMeta = {
  active:    { label: 'Activa',    icon: 'ti-player-play',  accent: 'var(--blue-raw)' },
  pending:   { label: 'Pendiente', icon: 'ti-clock',        accent: 'var(--text-muted)' },
  completed: { label: 'Completada',icon: 'ti-circle-check', accent: 'var(--text-muted)' },
}
const previewRules = computed(() => rules.activeRules.slice(0, 5))

// ── Environment helpers ──
function val(key) { return env.current?.[key]?.value ?? '—' }

const rightMetrics = computed(() => [
  { label: 'Temp. Interior', value: sensors.temperature?.value ?? '—', unit: '°C', icon: 'ti-thermometer' },
  { label: 'Temp. Exterior', value: val('ext_temperature'),             unit: '°C', icon: 'ti-thermometer' },
  { label: 'Humedad',        value: val('ext_humidity'),                unit: '%',  icon: 'ti-droplet' },
  { label: 'Viento',         value: val('wind_kmh'),                    unit: 'km/h', icon: 'ti-wind' },
])

const progressBars = computed(() => [
  { label: 'Renovables',           value: Number(val('renewables_pct')) || 0,   max: 100, unit: '%',    icon: 'ti-sun'         },
  { label: 'CO₂ intensidad',       value: Number(val('co2_g_kwh')) || 0,        max: 400, unit: 'g/kWh',icon: 'ti-leaf'        },
  { label: 'Riesgo incendio (FWI)',value: Number(val('fire_risk_fwi')) || 0,    max: 50,  unit: '',     icon: 'ti-flame'       },
  { label: 'Autonomía hídrica',    value: metrics.water_autonomy_days?.value || 0, max: 30, unit: 'd', icon: 'ti-droplet'     },
])
function barPct(b) { return Math.min((b.value / b.max) * 100, 100) }

// ── System health ──
const apiLabels = {
  open_meteo: 'Open-Meteo', nasa_power: 'NASA Power',
  redata: 'REData', effis: 'EFFIS', aemet: 'AEMET'
}
</script>

<template>
  <div class="view-inner panel-general">

    <div class="panel-layout">

      <!-- ══ LEFT ══ -->
      <div class="left-col">

        <!-- Building hero card -->
        <div class="card building-card">
          <div class="building-name">Cosentino HQ</div>
          <div class="building-loc"><i class="ti ti-map-pin" aria-hidden="true"></i> Barcelona</div>

          <div class="hero-temp">
            <span class="hero-num">{{ sensors.temperature?.value ?? '—' }}</span>
            <span class="hero-unit">°C</span>
          </div>

          <div class="hero-comfort">
            <i class="ti ti-sofa" aria-hidden="true"></i>
            Confort {{ metrics.comfort_score?.value ?? '—' }}/100
          </div>

          <div class="hero-hl">
            <span>H: {{ maxTemp }}°</span>
            <span>L: {{ minTemp }}°</span>
          </div>
        </div>

        <!-- Quick metrics -->
        <div class="card quick-metrics">
          <div class="qm-row">
            <i class="ti ti-battery-2 qm-icon" aria-hidden="true"></i>
            <div class="qm-body">
              <div class="qm-label">Batería</div>
              <div class="qm-value">{{ sensors.battery_level?.value ?? '—' }}<span class="qm-unit">%</span></div>
            </div>
          </div>
          <div class="qm-div"></div>
          <div class="qm-row">
            <i class="ti ti-sun qm-icon" aria-hidden="true"></i>
            <div class="qm-body">
              <div class="qm-label">Renovables</div>
              <div class="qm-value">{{ val('renewables_pct') }}<span class="qm-unit">%</span></div>
            </div>
          </div>
          <div class="qm-div"></div>
          <div class="qm-row">
            <i class="ti ti-leaf qm-icon" aria-hidden="true"></i>
            <div class="qm-body">
              <div class="qm-label">CO₂ intensidad</div>
              <div class="qm-value">{{ val('co2_g_kwh') }}<span class="qm-unit">g/kWh</span></div>
            </div>
          </div>
          <div class="qm-div"></div>
          <div class="qm-row">
            <i class="ti ti-droplet qm-icon" aria-hidden="true"></i>
            <div class="qm-body">
              <div class="qm-label">Autonomía hídrica</div>
              <div class="qm-value">{{ metrics.water_autonomy_days?.value ?? '—' }}<span class="qm-unit">d</span></div>
            </div>
          </div>
          <div class="qm-div"></div>
          <div class="qm-row">
            <i class="ti ti-flame qm-icon" aria-hidden="true"></i>
            <div class="qm-body">
              <div class="qm-label">Riesgo incendio (FWI)</div>
              <div class="qm-value">{{ val('fire_risk_fwi') }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- ══ CENTER ══ -->
      <div class="center-col">

        <!-- KPI Trio -->
        <div class="card kpi-trio-card">
          <div class="kpi-trio">

            <!-- Estabilidad térmica -->
            <div class="trio-kpi">
              <div class="trio-label">Estabilidad térmica</div>
              <div class="trio-value" :class="estabilidadOk ? 'kpi-ok' : 'kpi-warn'">
                {{ estabilidad }}<span class="trio-unit">%</span>
              </div>
              <div class="trio-target">Objetivo ≥95%</div>
              <div class="trio-track">
                <div class="trio-fill" :class="estabilidadOk ? 'fill-ok' : 'fill-warn'"
                     :style="{ width: kpiBarPct(estabilidad, 100) + '%' }"></div>
                <div class="trio-marker" :style="{ left: targetPct(95, 100) + '%' }"></div>
              </div>
            </div>

            <div class="trio-sep"></div>

            <!-- Captación de agua -->
            <div class="trio-kpi">
              <div class="trio-label">Captación de agua</div>
              <div class="trio-value" :class="captacionOk ? 'kpi-ok' : 'kpi-warn'">
                {{ captacion ?? '—' }}<span class="trio-unit">L/m²</span>
              </div>
              <div class="trio-target">Objetivo >20 L/m²</div>
              <div class="trio-track" v-if="captacion != null">
                <div class="trio-fill" :class="captacionOk ? 'fill-ok' : 'fill-warn'"
                     :style="{ width: kpiBarPct(captacion, 30) + '%' }"></div>
                <div class="trio-marker" :style="{ left: targetPct(20, 30) + '%' }"></div>
              </div>
            </div>

            <div class="trio-sep"></div>

            <!-- Balance energético neto -->
            <div class="trio-kpi">
              <div class="trio-label">Balance energético neto</div>
              <div class="trio-value" :class="balanceOk ? 'kpi-ok' : 'kpi-warn'">
                {{ balanceNeto >= 0 ? '+' : '' }}{{ balanceNeto }}<span class="trio-unit">%</span>
              </div>
              <div class="trio-target">Objetivo ≥0%</div>
              <div class="trio-track">
                <div class="trio-fill" :class="balanceOk ? 'fill-ok' : 'fill-warn'"
                     :style="{ width: kpiBarPct(Math.max(balanceNeto, 0), 100) + '%' }"></div>
                <div class="trio-marker" style="left: 0%"></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Middle row: AI Status + IA Insight -->
        <div class="center-middle">
          <div class="card ai-status-card">
            <div class="ai-header">
              <span class="ai-live-dot"></span>
              <span class="ai-title">Inteligencia Activa</span>
            </div>
            <div class="ai-num">{{ rules.activeRules.length }}</div>
            <div class="ai-sublabel">decisiones en curso</div>
            <RouterLink to="/decisiones" class="ai-link">
              Ver decisiones <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </RouterLink>
          </div>
          <InsightBox
            text="El sistema ha optimizado 3 parámetros activos. Confort térmico estable en 24.2°C. Excedente solar aprovechado al 65%."
          />
        </div>

        <!-- Reglas de IA -->
        <div class="card rules-card">
          <div class="card-hd">
            <div>
              <div class="card-title-sm">Reglas de IA</div>
              <div class="card-subtitle">Decisiones activas del sistema</div>
            </div>
            <RouterLink to="/decisiones" class="rules-see-all">
              Ver todas <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </RouterLink>
          </div>

          <div v-if="rules.loading" class="rules-loading">
            <div v-for="n in 3" :key="n" class="rule-sk"></div>
          </div>
          <ErrorState v-else-if="rules.error" compact :message="rules.error.message" @retry="rules.retry()" />
          <div v-else-if="!previewRules.length" class="chart-empty">Sin reglas activas</div>

          <div v-else class="rules-list">
            <div v-for="rule in previewRules" :key="rule.id" class="pg-rule-card"
                 :style="{ '--accent': statusMeta[rule.status]?.accent || 'var(--text-muted)' }">
              <div class="pg-rule-stripe">
                <i :class="`ti ${statusMeta[rule.status]?.icon || 'ti-circle'} pg-stripe-icon`" aria-hidden="true"></i>
              </div>
              <div class="pg-rule-body">
                <div class="pg-rule-top">
                  <span class="pg-rule-title">{{ rule.title }}</span>
                  <span class="pg-rule-status">{{ statusMeta[rule.status]?.label }}</span>
                </div>
                <div class="pg-rule-desc">{{ rule.description }}</div>
                <div class="pg-rule-meta">
                  <span v-if="rule.layer" class="pg-meta-tag">
                    <i class="ti ti-stack-2" aria-hidden="true"></i>{{ rule.layer }}
                  </span>
                  <span v-if="rule.source" class="pg-meta-tag">
                    <i class="ti ti-cpu" aria-hidden="true"></i>{{ rule.source }}
                  </span>
                  <span class="pg-rule-time">
                    <i class="ti ti-clock" aria-hidden="true"></i>{{ relativeTime(rule.triggered_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ RIGHT ══ -->
      <div class="right-col">

        <!-- 2×2 condition grid -->
        <div class="card cond-card">
          <div class="card-hd">
            <div class="card-title-sm">Condición Actual</div>
            <span class="cond-updated">hace 1 min</span>
          </div>
          <div class="cond-grid">
            <div v-for="m in rightMetrics" :key="m.label" class="cond-cell">
              <div class="cond-lbl">{{ m.label }}</div>
              <div class="cond-row">
                <span class="cond-val">{{ m.value }}</span>
                <span class="cond-unit">{{ m.unit }}</span>
              </div>
              <i :class="`ti ${m.icon} cond-icon`" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        <!-- Progress bar metrics -->
        <div class="card prog-card">
          <div class="card-title-sm">Métricas del Edificio</div>
          <div class="prog-list">
            <div v-for="bar in progressBars" :key="bar.label" class="prog-row">
              <div class="prog-top">
                <span class="prog-lbl">
                  <i :class="`ti ${bar.icon}`" aria-hidden="true"></i>
                  {{ bar.label }}
                </span>
                <span class="prog-val">{{ bar.value }}<span class="prog-unit">{{ bar.unit }}</span></span>
              </div>
              <div class="prog-track">
                <div class="prog-fill" :style="{ width: barPct(bar) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- System health -->
        <div class="card health-card">
          <div class="card-title-sm">Estado del Sistema</div>
          <template v-if="health.loading">
            <div v-for="n in 5" :key="n" class="sk-row"></div>
          </template>
          <ErrorState v-else-if="health.error" compact :message="health.error.message" @retry="health.retry()" />
          <template v-else>
            <div class="health-row">
              <StatusDot :status="health.sensors?.status || 'ok'" />
              <span class="health-lbl">Sensores</span>
              <span class="health-time">{{ relativeTime(health.sensors?.last_seen) }}</span>
            </div>
            <div v-for="(api, key) in health.apis" :key="key" class="health-row">
              <StatusDot :status="api.status" />
              <span class="health-lbl">{{ apiLabels[key] || key }}</span>
              <span class="health-time">{{ relativeTime(api.last_updated) }}</span>
            </div>
          </template>
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.panel-general { display: flex; flex-direction: column; gap: 14px; }

/* ── 3-col grid ── */
.panel-layout {
  display: grid;
  grid-template-columns: minmax(0, 210px) 1fr minmax(0, 210px);
  gap: 14px;
  align-items: start;
  min-width: 0;
}

/* shared card title */
.card-title-sm {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-muted);
}
.card-subtitle { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.card-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.chart-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px 0; }

/* ══ LEFT ══ */
.left-col { display: flex; flex-direction: column; gap: 12px; }

.building-card { padding: 22px 20px; }
.building-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
.building-loc {
  font-size: 11px; color: var(--text-muted); margin: 3px 0 16px;
  display: flex; align-items: center; gap: 4px;
}
.hero-temp { line-height: 1; display: flex; align-items: flex-start; gap: 2px; }
.hero-num { font-size: 60px; font-weight: 700; letter-spacing: -3px; color: var(--text); }
.hero-unit { font-size: 22px; color: var(--text-secondary); margin-top: 12px; }
.hero-comfort {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--text-secondary);
  margin: 8px 0 4px;
}
.hero-hl { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); font-weight: 500; }

.ai-status-card { padding: 18px 20px; }
.ai-header { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; }
.ai-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--blue-raw); box-shadow: 0 0 5px rgba(13,148,136,0.5);
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
.ai-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
.ai-num { font-size: 40px; font-weight: 700; letter-spacing: -1.5px; color: var(--text); line-height: 1; }
.ai-sublabel { font-size: 11px; color: var(--text-muted); margin: 2px 0 12px; }
.ai-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--blue-raw);
  text-decoration: none;
}

.quick-metrics { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.qm-row { display: flex; align-items: center; gap: 11px; padding: 3px 0; }
.qm-icon { font-size: 20px; color: var(--blue-raw); width: 22px; flex-shrink: 0; }
.qm-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.qm-value { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); line-height: 1.1; }
.qm-unit { font-size: 11px; color: var(--text-secondary); margin-left: 2px; }
.qm-div { height: 1px; background: var(--border); }

/* ══ CENTER ══ */
.center-col { display: flex; flex-direction: column; gap: 12px; }

/* KPI Trio */
.kpi-trio-card { padding: 20px 24px; }
.kpi-trio {
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  gap: 0;
  align-items: start;
}
.trio-sep { width: 1px; background: var(--border); align-self: stretch; margin: 0 20px; }

.trio-kpi { display: flex; flex-direction: column; gap: 6px; }

.trio-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.7px; color: var(--text-muted);
}
.trio-value {
  font-size: 28px; font-weight: 700; letter-spacing: -1px; line-height: 1;
}
.trio-value.kpi-ok   { color: var(--green); }
.trio-value.kpi-warn { color: var(--amber); }
.trio-unit { font-size: 13px; font-weight: 500; margin-left: 2px; color: inherit; opacity: 0.7; }

.trio-target {
  font-size: 10px; color: var(--text-muted); font-weight: 500;
}

.trio-track {
  position: relative; height: 6px;
  background: var(--card-alt); border-radius: 3px;
  margin-top: 4px; overflow: visible;
}
.trio-fill {
  height: 100%; border-radius: 3px; transition: width 0.4s;
}
.trio-fill.fill-ok   { background: var(--green); opacity: 0.85; }
.trio-fill.fill-warn { background: var(--amber); opacity: 0.85; }

.trio-marker {
  position: absolute; top: -4px; bottom: -4px;
  width: 2px; background: var(--border-strong);
  border-radius: 1px; transform: translateX(-50%);
}

/* Middle row: AI Status + Insight side by side */
.center-middle {
  display: grid;
  grid-template-columns: minmax(0, 160px) 1fr;
  gap: 12px;
  align-items: stretch;
}
.ai-status-card {
  padding: 18px 20px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.ai-header { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
.ai-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--blue-raw); box-shadow: 0 0 5px rgba(13,148,136,0.5);
  animation: pulse-dot 2s infinite;
}
.ai-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
.ai-num { font-size: 36px; font-weight: 700; letter-spacing: -1.5px; color: var(--text); line-height: 1; }
.ai-sublabel { font-size: 11px; color: var(--text-muted); margin: 2px 0 10px; }
.ai-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--blue-raw); text-decoration: none;
  margin-top: auto;
}

/* Reglas de IA card */
.rules-card { padding: 18px 20px; }
.rules-see-all {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--blue-raw); text-decoration: none;
  white-space: nowrap;
}
.rules-loading { display: flex; flex-direction: column; gap: 8px; }
.rule-sk { height: 52px; background: var(--card-alt); border-radius: var(--radius-card); }

.rules-list { display: flex; flex-direction: column; gap: 6px; }

.pg-rule-card {
  display: flex; align-items: stretch;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.pg-rule-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

.pg-rule-stripe {
  width: 34px; flex-shrink: 0;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-right: 3px solid var(--accent);
  display: flex; align-items: center; justify-content: center;
}
.pg-stripe-icon { font-size: 12px; color: var(--accent); animation: pulse-dot 2s infinite; }

.pg-rule-body { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.pg-rule-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pg-rule-title { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-rule-status { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent); flex-shrink: 0; }

.pg-rule-desc { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pg-rule-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pg-meta-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 500; color: var(--text-muted);
  background: var(--card-alt); border-radius: 3px; padding: 2px 7px;
}
.pg-meta-tag .ti { font-size: 10px; }
.pg-rule-time {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; color: var(--text-muted); margin-left: auto;
}
.pg-rule-time .ti { font-size: 10px; }

/* ══ RIGHT ══ */
.right-col { display: flex; flex-direction: column; gap: 12px; }

.cond-card { padding: 18px; }
.cond-updated { font-size: 10px; color: var(--text-muted); }
.cond-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: var(--border);
  border: 1px solid var(--border); border-radius: 6px; overflow: hidden;
  margin-top: 12px;
}
.cond-cell { background: var(--card-bg); padding: 10px 8px; }
.cond-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 5px; line-height: 1.3; }
.cond-row { display: flex; align-items: baseline; gap: 2px; flex-wrap: nowrap; }
.cond-val { font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; white-space: nowrap; }
.cond-unit { font-size: 9px; color: var(--text-secondary); white-space: nowrap; }
.cond-icon { display: none; }

.prog-card { padding: 18px; }
.prog-list { display: flex; flex-direction: column; gap: 13px; margin-top: 12px; }
.prog-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.prog-lbl { font-size: 11px; font-weight: 500; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; }
.prog-lbl .ti { font-size: 12px; color: var(--blue-raw); }
.prog-val { font-size: 14px; font-weight: 700; color: var(--text); }
.prog-unit { font-size: 11px; color: var(--text-muted); margin-left: 1px; }
.prog-track { height: 6px; background: var(--card-alt); border-radius: 3px; }
.prog-fill { height: 100%; background: var(--blue-raw); border-radius: 3px; transition: width 0.4s; opacity: 0.85; }

.health-card { padding: 18px; }
.health-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.health-row:first-of-type { margin-top: 10px; }
.health-row:last-child { border-bottom: none; padding-bottom: 0; }
.health-lbl { flex: 1; font-size: 11px; font-weight: 500; color: var(--text); }
.health-time { font-size: 10px; color: var(--text-muted); }
.sk-row { height: 22px; background: var(--card-alt); border-radius: 4px; margin-top: 8px; }

@media (max-width: 1200px) {
  .panel-layout { grid-template-columns: minmax(0, 180px) 1fr minmax(0, 180px); }
  .center-middle { grid-template-columns: minmax(0, 140px) 1fr; }
}
@media (max-width: 1080px) {
  .panel-layout { grid-template-columns: 1fr 1fr; }
  .center-col { grid-column: 1 / -1; order: -1; }
}
@media (max-width: 720px) {
  .panel-layout { grid-template-columns: 1fr; }
  .left-col, .center-col, .right-col { grid-column: 1; order: unset; }
  .center-middle { grid-template-columns: 1fr; }
  .kpi-trio { grid-template-columns: 1fr; }
  .trio-sep { display: none; }
  .trio-kpi { padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .trio-kpi:last-child { border-bottom: none; padding-bottom: 0; }
}
</style>
