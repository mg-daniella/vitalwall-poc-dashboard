<script setup>
import { computed } from 'vue'
import { useMetricsStore }     from '@/stores/metrics'
import { useEnvironmentStore } from '@/stores/environment'
import { useSensorsStore }     from '@/stores/sensors'
import DonutChart  from '@/components/charts/DonutChart.vue'
import MetricCard  from '@/components/ui/MetricCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import InsightBox  from '@/components/ui/InsightBox.vue'
import DataCard    from '@/components/ui/DataCard.vue'

const metrics = useMetricsStore()
const env     = useEnvironmentStore()
const sensors = useSensorsStore()

const donutData   = computed(() => [
  metrics.energy_source.solar_pct,
  metrics.energy_source.battery_pct,
  metrics.energy_source.grid_pct
])
const donutLabels = ['Solar', 'Batería', 'Red']
const donutColors = ['#EF9F27', '#1D9E75', '#378ADD']
</script>

<template>
  <div class="red">

    <div class="red-top">
      <!-- Donut -->
      <DataCard title="Mix energético actual">
        <DonutChart :data="donutData" :labels="donutLabels" :colors="donutColors" :height="200" />
        <div class="donut-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: #EF9F27;"></span>
            <span>Solar {{ metrics.energy_source.solar_pct }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #1D9E75;"></span>
            <span>Batería {{ metrics.energy_source.battery_pct }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #378ADD;"></span>
            <span>Red {{ metrics.energy_source.grid_pct }}%</span>
          </div>
        </div>
      </DataCard>

      <!-- Metrics -->
      <div class="red-metrics">
        <MetricCard
          label="Renovables"
          :value="env.current?.renewables_pct?.value"
          unit="%"
          :status="env.current?.renewables_pct?.status || 'ok'"
          badge="Mix eléctrico nacional"
        />
        <MetricCard
          label="CO₂ intensidad"
          :value="env.current?.co2_g_kwh?.value"
          unit="g/kWh"
          :status="env.current?.co2_g_kwh?.status || 'ok'"
        />
        <MetricCard
          label="Ahorro hoy"
          :value="metrics.savings_eur_today.value"
          unit="€"
          :status="metrics.savings_eur_today.status"
          badge="vs. sin gestión IA"
        />
      </div>
    </div>

    <!-- Battery -->
    <div class="card battery-card">
      <div class="card-title">Nivel de batería</div>
      <div class="battery-top">
        <span class="battery-value">{{ sensors.battery_level.value }}%</span>
        <span class="battery-label">{{ sensors.battery_level.value > 70 ? 'Carga alta' : sensors.battery_level.value > 30 ? 'Carga media' : 'Carga baja' }}</span>
      </div>
      <ProgressBar
        :value="sensors.battery_level.value"
        :color="sensors.battery_level.value > 70 ? 'var(--green)' : sensors.battery_level.value > 30 ? 'var(--amber)' : 'var(--red)'"
        :right-label="`${sensors.battery_level.value}% / 100%`"
      />
    </div>

    <InsightBox
      text="El 90% del consumo actual proviene de fuentes renovables (solar + batería). La intensidad de CO₂ está un 38% por debajo de la media nacional. Ahorro acumulado hoy: 15.40€."
    />

  </div>
</template>

<style scoped>
.red { display: flex; flex-direction: column; gap: 14px; }
.red-top { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.red-metrics { display: flex; flex-direction: column; gap: 10px; }

.donut-legend { display: flex; gap: 14px; margin-top: 12px; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-secondary); }
.legend-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.battery-card {}
.battery-top { display: flex; align-items: baseline; gap: 10px; margin: 6px 0 10px; }
.battery-value { font-size: 36px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.battery-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
</style>
