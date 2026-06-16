<script setup>
import { computed } from 'vue'
import { useMetricsStore }     from '@/stores/metrics'
import { useEnvironmentStore } from '@/stores/environment'
import { useSensorsStore }     from '@/stores/sensors'
import InsightBox from '@/components/ui/InsightBox.vue'

const metrics = useMetricsStore()
const env     = useEnvironmentStore()
const sensors = useSensorsStore()

const solar   = computed(() => metrics.energy_source?.solar_pct   ?? 60)
const battery = computed(() => metrics.energy_source?.battery_pct ?? 23)
const grid    = computed(() => metrics.energy_source?.grid_pct    ?? 17)

const sources = computed(() => [
  {
    key:    'solar',
    icon:   'ti-sun',
    label:  'Solar',
    sub:    'Fotovoltaica',
    value:  solar.value,
    opacity: 1,
  },
  {
    key:    'battery',
    icon:   'ti-battery-charging',
    label:  'Batería',
    sub:    'Almacenada',
    value:  battery.value,
    opacity: 0.55,
  },
  {
    key:    'grid',
    icon:   'ti-bolt',
    label:  'Red',
    sub:    'Mix nacional',
    value:  grid.value,
    opacity: 0.22,
  },
])

const batteryVal   = computed(() => sensors.battery_level?.value ?? 0)
const batteryLabel = computed(() => batteryVal.value > 70 ? 'Carga alta' : batteryVal.value > 30 ? 'Carga media' : 'Carga baja')

const metricRows = computed(() => [
  {
    icon:  'ti-leaf',
    label: 'Energía renovable',
    value: env.current?.renewables_pct?.value ?? '—',
    unit:  '%',
    sub:   'Mix eléctrico nacional',
  },
  {
    icon:  'ti-cloud',
    label: 'CO₂ intensidad',
    value: env.current?.co2_g_kwh?.value ?? '—',
    unit:  'g/kWh',
    sub:   'Red eléctrica actual',
  },
  {
    icon:  'ti-coin-euro',
    label: 'Ahorro hoy',
    value: metrics.savings_eur_today?.value ?? '—',
    unit:  '€',
    sub:   'vs. sin gestión IA',
  },
])
</script>

<template>
  <div class="view-inner red">

    <!-- InsightBox always at the top -->
    <InsightBox
      text="El 90% del consumo actual proviene de fuentes renovables (solar + batería). La intensidad de CO₂ está un 38% por debajo de la media nacional. Ahorro acumulado hoy: 15.40€."
    />

    <!-- Energy mix — main graphic -->
    <div class="card mix-card">
      <div class="mix-header">
        <div class="section-label">Mix energético actual</div>
        <span class="mix-total-pill">
          <i class="ti ti-activity"></i>
          En tiempo real
        </span>
      </div>

      <!-- Vertical bar chart -->
      <div class="mix-chart">
        <div v-for="s in sources" :key="s.key" class="mix-bar-col">
          <div class="mix-bar-pct">{{ s.value }}%</div>
          <div class="mix-bar-track">
            <div class="mix-bar-fill" :style="{ height: s.value + '%', opacity: s.opacity }"></div>
          </div>
          <div class="mix-bar-icon">
            <i :class="`ti ${s.icon}`" aria-hidden="true"></i>
          </div>
          <div class="mix-bar-label">{{ s.label }}</div>
          <div class="mix-bar-sub">{{ s.sub }}</div>
        </div>
      </div>
    </div>

    <!-- Bottom row: battery + metrics -->
    <div class="bottom-grid">

      <!-- Battery level -->
      <div class="card battery-card">
        <div class="section-label">Nivel de batería</div>
        <div class="battery-num-row">
          <div class="battery-num">{{ batteryVal }}<span class="battery-unit">%</span></div>
          <span class="battery-status-pill">{{ batteryLabel }}</span>
        </div>

        <!-- Thick battery bar -->
        <div class="battery-bar-wrap">
          <div class="battery-bar-track">
            <div class="battery-bar-fill" :style="{ width: batteryVal + '%' }"></div>
          </div>
          <!-- Segment marks at 30% and 70% -->
          <div class="battery-mark" style="left: 30%"><span class="battery-mark-label">30%</span></div>
          <div class="battery-mark" style="left: 70%"><span class="battery-mark-label">70%</span></div>
        </div>

        <div class="battery-ticks">
          <span>Baja</span>
          <span>Media</span>
          <span>Alta</span>
        </div>
      </div>

      <!-- Metric rows -->
      <div class="card metrics-card">
        <div class="section-label" style="margin-bottom: 14px;">Indicadores energéticos</div>
        <div v-for="(m, i) in metricRows" :key="m.label" class="metric-row">
          <div class="metric-row-left">
            <div class="metric-icon-wrap">
              <i :class="`ti ${m.icon}`" aria-hidden="true"></i>
            </div>
            <div>
              <div class="metric-label">{{ m.label }}</div>
              <div class="metric-sub">{{ m.sub }}</div>
            </div>
          </div>
          <div class="metric-value-col">
            <span class="metric-val">{{ m.value }}</span>
            <span class="metric-unit">{{ m.unit }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.red { display: flex; flex-direction: column; gap: 14px; }

.section-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--text-secondary);
}

/* ── Mix card ── */
.mix-card { padding: 22px 24px; display: flex; flex-direction: column; gap: 22px; }

.mix-header { display: flex; align-items: center; justify-content: space-between; }
.mix-total-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600; color: var(--blue-raw);
  background: rgba(55,138,221,0.08); border: 1px solid rgba(55,138,221,0.2);
  border-radius: 20px; padding: 4px 10px;
}
.mix-total-pill .ti { font-size: 11px; }

/* Vertical bar chart */
.mix-chart {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 16px; align-items: end;
  height: 220px;
  padding-bottom: 0;
}
.mix-bar-col {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; height: 100%;
}
.mix-bar-pct {
  font-size: 20px; font-weight: 700; letter-spacing: -0.5px;
  color: var(--text); line-height: 1; flex-shrink: 0;
}
.mix-bar-track {
  flex: 1; width: 64px;
  background: var(--card-alt); border-radius: 8px;
  display: flex; flex-direction: column; justify-content: flex-end;
  overflow: hidden;
}
.mix-bar-fill {
  width: 100%; background: var(--blue-raw);
  border-radius: 8px; transition: height 0.5s ease;
}
.mix-bar-icon {
  font-size: 18px; color: var(--blue-raw);
  flex-shrink: 0;
}
.mix-bar-label { font-size: 12px; font-weight: 700; color: var(--text); }
.mix-bar-sub   { font-size: 10px; color: var(--text-muted); }

/* ── Bottom grid ── */
.bottom-grid {
  display: grid; grid-template-columns: 1fr 1.4fr;
  gap: 12px; align-items: start;
}

/* Battery card */
.battery-card { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }

.battery-num-row { display: flex; align-items: center; gap: 14px; }
.battery-num {
  font-size: 52px; font-weight: 700; letter-spacing: -2px;
  color: var(--text); line-height: 1;
}
.battery-unit { font-size: 20px; font-weight: 400; color: var(--text-secondary); margin-left: 2px; }
.battery-status-pill {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--blue-raw);
  background: rgba(55,138,221,0.10); border: 1px solid rgba(55,138,221,0.2);
  border-radius: 20px; padding: 4px 10px;
}

.battery-bar-wrap { position: relative; padding-bottom: 14px; }
.battery-bar-track {
  height: 14px; background: var(--card-alt);
  border-radius: 7px; overflow: hidden;
}
.battery-bar-fill {
  height: 100%; background: var(--blue-raw);
  border-radius: 7px; transition: width 0.5s;
}
.battery-mark {
  position: absolute; top: -3px;
  width: 2px; height: calc(14px + 6px);
  background: var(--card-bg);
  transform: translateX(-50%);
}
.battery-mark-label {
  position: absolute; top: calc(100% + 2px); left: 50%;
  transform: translateX(-50%);
  font-size: 8px; color: var(--text-muted); font-weight: 600;
  white-space: nowrap;
}
.battery-ticks {
  display: flex; justify-content: space-between;
  font-size: 9px; color: var(--text-muted); padding: 0 2px;
}

/* Metrics card */
.metrics-card { padding: 20px 22px; display: flex; flex-direction: column; }

.metric-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.metric-row:last-child { border-bottom: none; padding-bottom: 0; }

.metric-row-left { display: flex; align-items: center; gap: 12px; }
.metric-icon-wrap {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  background: rgba(55,138,221,0.10);
  color: var(--blue-raw);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
}
.metric-label { font-size: 12px; font-weight: 600; color: var(--text); }
.metric-sub   { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

.metric-value-col { display: flex; align-items: baseline; gap: 3px; flex-shrink: 0; }
.metric-val  { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.metric-unit { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
</style>
