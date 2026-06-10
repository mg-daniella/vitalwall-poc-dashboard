<script setup>
import { computed } from 'vue'
import { useSensorsStore } from '@/stores/sensors'
import { useMetricsStore } from '@/stores/metrics'
import { useEnvironmentStore } from '@/stores/environment'
import MetricCard  from '@/components/ui/MetricCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import InsightBox  from '@/components/ui/InsightBox.vue'
import DataCard    from '@/components/ui/DataCard.vue'

const sensors = useSensorsStore()
const metrics = useMetricsStore()
const env     = useEnvironmentStore()

const tankColor = computed(() => {
  const v = sensors.water_level.value
  return v > 60 ? 'var(--blue-raw)' : v > 30 ? 'var(--amber)' : 'var(--red)'
})

const autonomyColor = computed(() => {
  const v = metrics.water_autonomy_days.value
  return v > 10 ? 'var(--green)' : v > 5 ? 'var(--amber)' : 'var(--red)'
})

// Simulated daily capture: based on water level
const dailyCaptureLiters = computed(() => (sensors.water_level.value * 12.5).toFixed(0))
</script>

<template>
  <div class="agua">

    <div class="metrics-grid">
      <MetricCard
        label="Nivel del depósito"
        :value="sensors.water_level.value"
        unit="%"
        :status="sensors.water_level.status"
        badge="Capacidad total"
      />
      <MetricCard
        label="Autonomía hídrica"
        :value="metrics.water_autonomy_days.value"
        unit="días"
        :status="metrics.water_autonomy_days.status"
      />
      <MetricCard
        label="Balance hídrico"
        :value="env.current?.water_balance_mm?.value"
        unit="mm"
        :status="env.current?.water_balance_mm?.status || 'ok'"
      />
      <MetricCard
        label="Captura hoy"
        :value="dailyCaptureLiters"
        unit="L"
        status="ok"
      />
    </div>

    <!-- Tank visualization -->
    <DataCard title="Estado del depósito">
      <div class="tank-wrap">
        <div class="tank-visual">
          <svg viewBox="0 0 100 140" class="tank-svg">
            <!-- Tank outline -->
            <rect x="10" y="10" width="80" height="120" rx="6" fill="var(--card-alt)" stroke="var(--border-strong)" stroke-width="1.5"/>
            <!-- Water fill -->
            <rect
              x="11"
              :y="10 + (120 * (1 - sensors.water_level.value / 100))"
              width="78"
              :height="120 * (sensors.water_level.value / 100)"
              fill="var(--blue-raw)"
              opacity="0.5"
              rx="0"
            />
            <!-- Level text -->
            <text x="50" y="75" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text)" font-family="Inter">
              {{ sensors.water_level.value }}%
            </text>
            <text x="50" y="92" text-anchor="middle" font-size="8" fill="var(--text-muted)" font-family="Inter">
              NIVEL
            </text>
          </svg>
        </div>
        <div class="tank-details">
          <ProgressBar
            :value="sensors.water_level.value"
            :color="tankColor"
            label="Nivel actual"
            :right-label="`${sensors.water_level.value}% — ${(sensors.water_level.value * 50).toFixed(0)} litros`"
          />
          <div class="tank-stats">
            <div class="tstat">
              <span class="tstat-label">Capacidad total</span>
              <span class="tstat-val">5.000 L</span>
            </div>
            <div class="tstat">
              <span class="tstat-label">Volumen actual</span>
              <span class="tstat-val">{{ (sensors.water_level.value * 50).toFixed(0) }} L</span>
            </div>
            <div class="tstat">
              <span class="tstat-label">Autonomía estimada</span>
              <span class="tstat-val" :class="metrics.water_autonomy_days.value < 5 ? 'warn' : 'ok'">
                {{ metrics.water_autonomy_days.value }} días
              </span>
            </div>
            <div class="tstat">
              <span class="tstat-label">Consumo diario medio</span>
              <span class="tstat-val">420 L/día</span>
            </div>
          </div>
        </div>
      </div>
    </DataCard>

    <InsightBox
      text="Sistema hídrico estable con 12 días de autonomía. Balance hídrico negativo (-15.2mm) compensado por la capacidad actual del depósito. Se recomienda monitorizar si el déficit supera -25mm en los próximos 7 días."
    />

  </div>
</template>

<style scoped>
.agua { display: flex; flex-direction: column; gap: 14px; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 10px;
}

.tank-wrap { display: flex; gap: 24px; align-items: flex-start; margin-top: 8px; }
.tank-visual { flex-shrink: 0; }
.tank-svg { width: 80px; height: 112px; }
.tank-details { flex: 1; display: flex; flex-direction: column; gap: 16px; }

.tank-stats { display: flex; flex-direction: column; gap: 6px; }
.tstat { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid var(--border); }
.tstat:last-child { border-bottom: none; }
.tstat-label { color: var(--text-secondary); font-weight: 500; }
.tstat-val { color: var(--text); font-weight: 700; }
.tstat-val.ok   { color: var(--green); }
.tstat-val.warn { color: var(--amber); }
</style>
