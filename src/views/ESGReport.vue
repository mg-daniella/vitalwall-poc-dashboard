<script setup>
import { computed } from 'vue'

function downloadReport() { window.print() }
import { useMetricsStore }      from '@/stores/metrics'
import { useEnvironmentStore }  from '@/stores/environment'
import InsightBox from '@/components/ui/InsightBox.vue'

const metrics = useMetricsStore()
const env     = useEnvironmentStore()

function envVal(key) { return env.current?.[key]?.value ?? '—' }

const kpis = computed(() => [
  {
    icon: 'ti-leaf',
    label: 'CO₂ Evitado',
    value: metrics.co2_avoided?.value ?? '4.2',
    unit: 't CO₂e',
    sub: 'este mes',
    delta: '+12% vs mes anterior',
    up: true,
  },
  {
    icon: 'ti-sun',
    label: 'Energía Renovable',
    value: metrics.renewables_pct?.value ?? '68',
    unit: '%',
    sub: 'del consumo total',
    delta: '+5pp vs objetivo',
    up: true,
  },
  {
    icon: 'ti-droplet',
    label: 'Agua Captada',
    value: metrics.water_total_month?.value ?? '3.8',
    unit: 'm³',
    sub: 'captación pluvial mensual',
    delta: '+18% vs ayer',
    up: true,
  },
  {
    icon: 'ti-bolt',
    label: 'Intensidad Energética',
    value: envVal('co2_g_kwh') !== '—' ? envVal('co2_g_kwh') : '112',
    unit: 'g CO₂/kWh',
    sub: 'red eléctrica actual',
    delta: '−8% vs media anual',
    up: true,
  },
])

const pillars = [
  {
    icon: 'ti-leaf',
    label: 'Medioambiental',
    color: 'var(--blue-raw)',
    items: [
      { label: 'Huella de carbono mensual',  value: '4.2 t CO₂e',   target: '< 5 t',   pct: 84  },
      { label: 'Consumo de agua',            value: '3.8 m³',        target: '< 5 m³',  pct: 76  },
      { label: 'Generación solar',           value: '38.4 kWh/día',  target: '35 kWh',  pct: 100 },
      { label: 'Residuos reciclados',        value: '91%',           target: '> 85%',   pct: 100 },
    ]
  },
  {
    icon: 'ti-users',
    label: 'Social',
    color: 'var(--blue-raw)',
    items: [
      { label: 'Índice de confort térmico',  value: '87 / 100',      target: '> 80',    pct: 87  },
      { label: 'Calidad del aire interior',  value: 'AQI 22',        target: '< 50',    pct: 100 },
      { label: 'Ocupación media edificio',   value: '74%',           target: '—',       pct: 74  },
      { label: 'Incidencias reportadas',     value: '0',             target: '0',       pct: 100 },
    ]
  },
  {
    icon: 'ti-building',
    label: 'Gobernanza',
    color: 'var(--blue-raw)',
    items: [
      { label: 'Reglas IA ejecutadas (mes)', value: '142',           target: '—',       pct: 100 },
      { label: 'Overrides manuales',         value: '3',             target: '< 10',    pct: 100 },
      { label: 'Disponibilidad sistema',     value: '99.7%',         target: '> 99%',   pct: 100 },
      { label: 'Auditorías completadas',     value: '2 / 2',         target: '2',       pct: 100 },
    ]
  },
]

const timeline = [
  { month: 'Ene', co2: 5.8, energy: 31 },
  { month: 'Feb', co2: 5.2, energy: 33 },
  { month: 'Mar', co2: 4.9, energy: 35 },
  { month: 'Abr', co2: 4.6, energy: 36 },
  { month: 'May', co2: 4.3, energy: 37 },
  { month: 'Jun', co2: 4.2, energy: 38 },
]

const maxCo2 = Math.max(...timeline.map(t => t.co2))
const maxEnergy = Math.max(...timeline.map(t => t.energy))
</script>

<template>
  <div class="view-inner esg">

    <!-- Page header -->
    <div class="esg-page-header">
      <div>
        <div class="esg-page-title">Informe ESG</div>
        <div class="esg-page-sub">Medioambiental · Social · Gobernanza — {{ new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}</div>
      </div>
      <div class="esg-header-right">
        <div class="esg-badge">
          <i class="ti ti-certificate" aria-hidden="true"></i>
          Cosentino HQ · Almería
        </div>
        <button class="download-btn" @click="downloadReport">
          <i class="ti ti-download" aria-hidden="true"></i>
          Descargar PDF
        </button>
      </div>
    </div>

    <!-- InsightBox -->
    <InsightBox text="El edificio opera con un 68% de energía renovable este mes. La huella de carbono se ha reducido un 12% respecto al período anterior, superando los objetivos ESG trimestrales." />

    <!-- KPI row -->
    <div class="kpi-row">
      <div v-for="k in kpis" :key="k.label" class="kpi-card card">
        <i :class="`ti ${k.icon} kpi-icon`" aria-hidden="true"></i>
        <div class="kpi-main">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value">{{ k.value }}<span class="kpi-unit">{{ k.unit }}</span></div>
          <div class="kpi-sub">{{ k.sub }}</div>
        </div>
        <div class="kpi-delta" :class="{ up: k.up }">
          <i :class="`ti ${k.up ? 'ti-arrow-up' : 'ti-arrow-down'}`" aria-hidden="true"></i>
          {{ k.delta }}
        </div>
      </div>
    </div>

    <!-- Pillars grid -->
    <div class="pillars-grid">
      <div v-for="pillar in pillars" :key="pillar.label" class="pillar-card card">
        <div class="pillar-header">
          <i :class="`ti ${pillar.icon} pillar-icon`" aria-hidden="true"></i>
          <span class="pillar-label">{{ pillar.label }}</span>
        </div>
        <div class="pillar-items">
          <div v-for="item in pillar.items" :key="item.label" class="pillar-row">
            <div class="pillar-row-top">
              <span class="pillar-item-label">{{ item.label }}</span>
              <span class="pillar-item-value">{{ item.value }}</span>
            </div>
            <div class="pillar-row-sub">
              <div class="pillar-track">
                <div class="pillar-fill" :style="{ width: item.pct + '%' }"></div>
              </div>
              <span class="pillar-target">Meta: {{ item.target }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CO₂ trend chart -->
    <div class="card trend-card">
      <div class="trend-header">
        <div>
          <div class="trend-title">Tendencia CO₂ y Energía Renovable</div>
          <div class="trend-sub">Últimos 6 meses · Cosentino HQ Almería</div>
        </div>
        <div class="trend-legend">
          <span class="leg-item"><span class="leg-dot solid"></span>CO₂ (t)</span>
          <span class="leg-item"><span class="leg-dot faded"></span>Energía (kWh/día)</span>
        </div>
      </div>
      <div class="trend-chart">
        <div v-for="t in timeline" :key="t.month" class="trend-col">
          <div class="trend-bars">
            <div class="trend-bar-wrap">
              <div class="trend-bar co2-bar" :style="{ height: (t.co2 / maxCo2 * 100) + '%' }"></div>
            </div>
            <div class="trend-bar-wrap">
              <div class="trend-bar energy-bar" :style="{ height: (t.energy / maxEnergy * 100) + '%' }"></div>
            </div>
          </div>
          <div class="trend-month">{{ t.month }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.esg { display: flex; flex-direction: column; gap: 16px; }

/* Page header */
.esg-page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
}
.esg-page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.4px; color: var(--text); }
.esg-page-sub   { font-size: 12px; color: var(--text-muted); margin-top: 3px; text-transform: capitalize; }
.esg-header-right { display: flex; align-items: center; gap: 10px; }

.esg-badge {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: var(--blue-raw);
  background: rgba(55,138,221,0.08); border: 1px solid rgba(55,138,221,0.2);
  border-radius: 20px; padding: 5px 12px;
}
.esg-badge .ti { font-size: 13px; }

.download-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  background: var(--blue-raw); color: #fff;
  border: none; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
  white-space: nowrap;
}
.download-btn:hover { opacity: 0.88; }
.download-btn .ti { font-size: 14px; }

@media print {
  /* Hide download button and badge — already handled globally for sidebar/topbar */
  .download-btn, .esg-badge { display: none !important; }

  /* Keep grids intact on paper */
  .kpi-row      { grid-template-columns: repeat(4, 1fr) !important; }
  .pillars-grid { grid-template-columns: repeat(3, 1fr) !important; }
}

/* KPI row */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.kpi-card {
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative;
}
.kpi-icon {
  font-size: 20px; color: var(--blue-raw);
  opacity: 0.7;
}
.kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-muted); }
.kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; color: var(--text); line-height: 1; }
.kpi-unit  { font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-left: 3px; }
.kpi-sub   { font-size: 11px; color: var(--text-muted); }
.kpi-delta {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 4px; align-self: flex-start;
  background: rgba(55,138,221,0.10); color: var(--blue-raw);
}
.kpi-delta .ti { font-size: 9px; }

/* Pillars */
.pillars-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.pillar-card  { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.pillar-header { display: flex; align-items: center; gap: 8px; }
.pillar-icon   { font-size: 16px; color: var(--blue-raw); }
.pillar-label  { font-size: 13px; font-weight: 700; color: var(--text); }

.pillar-items { display: flex; flex-direction: column; gap: 12px; }
.pillar-row-top {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 5px;
}
.pillar-item-label { font-size: 12px; color: var(--text-secondary); }
.pillar-item-value { font-size: 12px; font-weight: 700; color: var(--text); flex-shrink: 0; margin-left: 8px; }
.pillar-row-sub { display: flex; align-items: center; gap: 8px; }
.pillar-track { flex: 1; height: 5px; background: var(--card-alt); border-radius: 3px; }
.pillar-fill  { height: 100%; background: var(--blue-raw); border-radius: 3px; opacity: 0.8; transition: width 0.4s; }
.pillar-target { font-size: 9px; color: var(--text-muted); flex-shrink: 0; white-space: nowrap; }

/* Trend chart */
.trend-card   { padding: 20px 22px; }
.trend-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.trend-title  { font-size: 13px; font-weight: 700; color: var(--text); }
.trend-sub    { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.trend-legend { display: flex; align-items: center; gap: 14px; }
.leg-item     { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.leg-dot      { width: 10px; height: 10px; border-radius: 2px; }
.leg-dot.solid { background: var(--blue-raw); }
.leg-dot.faded { background: var(--blue-raw); opacity: 0.3; }

.trend-chart {
  display: flex; align-items: flex-end; gap: 12px;
  height: 120px;
}
.trend-col   { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; height: 100%; }
.trend-bars  { display: flex; align-items: flex-end; gap: 3px; flex: 1; width: 100%; }
.trend-bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.trend-bar   { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.4s; }
.co2-bar     { background: var(--blue-raw); }
.energy-bar  { background: var(--blue-raw); opacity: 0.28; }
.trend-month { font-size: 10px; color: var(--text-muted); font-weight: 500; }
</style>
