<script setup>
import { computed } from 'vue'
import { useSensorsStore }      from '@/stores/sensors'
import { useEnvironmentStore }  from '@/stores/environment'
import { useMetricsStore }      from '@/stores/metrics'
import { useRulesStore }        from '@/stores/rules'
import { useSystemHealthStore } from '@/stores/systemHealth'
import MetricCard   from '@/components/ui/MetricCard.vue'
import DataCard     from '@/components/ui/DataCard.vue'
import InsightBox   from '@/components/ui/InsightBox.vue'
import StatusDot    from '@/components/ui/StatusDot.vue'
import RuleRow      from '@/components/ui/RuleRow.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ErrorState   from '@/components/ui/ErrorState.vue'

const sensors = useSensorsStore()
const env     = useEnvironmentStore()
const metrics = useMetricsStore()
const rules   = useRulesStore()
const health  = useSystemHealthStore()

const envCards = computed(() => {
  const c = env.current
  return [
    { key: 'ext_temperature',  label: 'Temp. exterior',  icon: '🌡' },
    { key: 'fire_risk_fwi',    label: 'Riesgo incendio', icon: '🔥' },
    { key: 'renewables_pct',   label: 'Renovables',      icon: '☀' },
    { key: 'uv_index',         label: 'Índice UV',       icon: '🔆' }
  ].map(({ key, label, icon }) => ({
    label, icon,
    value:  c[key]?.value ?? '—',
    unit:   c[key]?.unit  ?? '',
    status: c[key]?.status ?? 'ok'
  }))
})

const apiLabels = {
  open_meteo: 'Open-Meteo',
  nasa_power: 'NASA Power',
  redata:     'REData',
  effis:      'EFFIS',
  aemet:      'AEMET'
}

function relativeTime(iso) {
  if (!iso) return 'N/A'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  return mins < 2 ? 'ahora' : `hace ${mins}m`
}
</script>

<template>
  <div class="panel-general">

    <!-- 6 metric cards -->
    <section class="metrics-grid">
      <template v-if="sensors.loading || metrics.loading">
        <SkeletonCard v-for="n in 6" :key="n" />
      </template>
      <template v-else-if="sensors.error || metrics.error">
        <div class="error-span">
          <ErrorState
            :message="(sensors.error || metrics.error).message"
            :status="(sensors.error || metrics.error).status"
            :retry-exhausted="(sensors.error || metrics.error).retryExhausted"
            :retrying="sensors.retrying || metrics.retrying"
            @retry="sensors.retry(); metrics.retry()"
          />
        </div>
      </template>
      <template v-else>
        <MetricCard
          label="Confort"
          :value="metrics.comfort_score.value"
          unit="/100"
          :status="metrics.comfort_score.status"
          badge="Confort óptimo"
        />
        <MetricCard
          label="Temp. Interior"
          :value="sensors.temperature.value"
          unit="°C"
          :status="sensors.temperature.status"
        />
        <MetricCard
          label="Temp. Exterior"
          :value="env.current?.ext_temperature?.value"
          unit="°C"
          :status="env.current?.ext_temperature?.status || 'ok'"
        />
        <MetricCard
          label="Reglas activas"
          :value="rules.activeRules.length"
          unit=""
          status="ok"
          badge="Sistema autónomo"
        />
        <MetricCard
          label="Autonomía hídrica"
          :value="metrics.water_autonomy_days.value"
          unit="días"
          :status="metrics.water_autonomy_days.status"
        />
        <MetricCard
          label="Batería"
          :value="sensors.battery_level.value"
          unit="%"
          :status="sensors.battery_level.status"
        />
      </template>
    </section>

    <!-- Data grid -->
    <section class="data-grid">
      <!-- Cerebro activo -->
      <DataCard title="Cerebro Activo — Decisiones en curso" link-text="Ver todas" link-to="/decisiones">
        <template v-if="rules.loading">
          <div v-for="n in 3" :key="n" class="skeleton-row"></div>
        </template>
        <template v-else>
          <RuleRow v-for="rule in rules.activeRules.slice(0,3)" :key="rule.id" :rule="rule" />
          <InsightBox
            class="mt-12"
            text="El sistema ha optimizado 3 parámetros activos. Confort térmico estable. Excedente solar aprovechado al 65%."
          />
        </template>
      </DataCard>

      <!-- Salud del sistema -->
      <DataCard title="Salud del Sistema" link-text="Detalle" link-to="/salud">
        <template v-if="health.loading">
          <div v-for="n in 6" :key="n" class="skeleton-row"></div>
        </template>
        <template v-else-if="health.error">
          <ErrorState
            compact
            :message="health.error.message"
            :status="health.error.status"
            :retry-exhausted="health.error.retryExhausted"
            :retrying="health.retrying"
            @retry="health.retry()"
          />
        </template>
        <template v-else>
          <div class="health-row">
            <StatusDot :status="health.sensors.status" />
            <span class="health-label">Sensores</span>
            <span class="health-time">{{ relativeTime(health.sensors.last_seen) }}</span>
          </div>
          <div v-for="(api, key) in health.apis" :key="key" class="health-row">
            <StatusDot :status="api.status" />
            <span class="health-label">{{ apiLabels[key] || key }}</span>
            <span class="health-time">{{ relativeTime(api.last_updated) }}</span>
          </div>
        </template>
      </DataCard>
    </section>

    <!-- Contexto ambiental full-width -->
    <DataCard title="Contexto Ambiental">
      <div class="env-grid">
        <div v-for="card in envCards" :key="card.key" class="env-item">
          <div class="env-icon">{{ card.icon }}</div>
          <div class="env-body">
            <div class="env-label">{{ card.label }}</div>
            <div class="env-value" :class="card.status">
              {{ card.value }}<span class="env-unit">{{ card.unit }}</span>
            </div>
            <div class="env-status" :class="card.status">
              {{ card.status === 'ok' ? 'Normal' : card.status === 'warning' ? 'Aviso' : 'Alerta' }}
            </div>
          </div>
          <StatusDot :status="card.status" />
        </div>
      </div>
    </DataCard>

  </div>
</template>

<style scoped>
.panel-general { display: flex; flex-direction: column; gap: 16px; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: 10px;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.health-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}
.health-row:last-child { border-bottom: none; }
.health-label { flex: 1; font-size: 12px; font-weight: 500; color: var(--text); }
.health-time  { font-size: 11px; color: var(--text-muted); }

.env-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.env-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--card-alt);
  border-radius: var(--radius-card);
  padding: 12px;
}
.env-icon { font-size: 20px; flex-shrink: 0; }
.env-body { flex: 1; }
.env-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); margin-bottom: 3px; }
.env-value { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.env-value.warning { color: var(--amber); }
.env-value.danger  { color: var(--red); }
.env-unit  { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-left: 2px; }
.env-status { font-size: 11px; font-weight: 500; margin-top: 2px; }
.env-status.ok      { color: var(--green); }
.env-status.warning { color: var(--amber); }
.env-status.danger  { color: var(--red); }

.skeleton-row { height: 28px; background: var(--card-alt); border-radius: 4px; margin-bottom: 6px; }
.error-span { grid-column: 1 / -1; }
.mt-12 { margin-top: 12px; }

@media (max-width: 900px) {
  .data-grid { grid-template-columns: 1fr; }
  .env-grid  { grid-template-columns: repeat(2, 1fr); }
}
</style>
