<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSensorsStore } from '@/stores/sensors'
import { useMetricsStore } from '@/stores/metrics'
import { useApi }          from '@/composables/useApi'
import InsightBox  from '@/components/ui/InsightBox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusDot   from '@/components/ui/StatusDot.vue'
import { useToastsStore } from '@/stores/toasts'
const toasts = useToastsStore()

const sensors = useSensorsStore()
const metrics = useMetricsStore()
const api     = useApi()

const tempMin  = ref(20)
const tempMax  = ref(26)
const humMin   = ref(40)
const humMax   = ref(60)
const saving   = ref(false)
const saved    = ref(false)

onMounted(async () => {
  const data = await api.getComfort()
  tempMin.value = data.temperature_min ?? 20
  tempMax.value = data.temperature_max ?? 26
  humMin.value  = data.humidity_min    ?? 40
  humMax.value  = data.humidity_max    ?? 60
})

async function saveConfig() {
  saving.value = true
  try {
    await api.saveComfort({
      temperature_min: tempMin.value, temperature_max: tempMax.value,
      humidity_min:    humMin.value,  humidity_max:    humMax.value
    })
    saved.value = true
    toasts.success('Configuración de confort guardada')
    setTimeout(() => saved.value = false, 2500)
  } catch (err) {
    toasts.error('No se pudo guardar la configuración: ' + (err.message || 'error desconocido'))
  } finally {
    saving.value = false
  }
}

const tempInRange = computed(() => {
  const v = sensors.temperature.value
  return v >= tempMin.value && v <= tempMax.value
})
const humInRange = computed(() => {
  const v = sensors.humidity.value
  return v >= humMin.value && v <= humMax.value
})
</script>

<template>
  <div class="confort">

    <div class="confort-layout">

      <!-- Current readings -->
      <div class="readings-col">
        <div class="card reading-card">
          <div class="card-title">Temperatura actual</div>
          <div class="reading-value">
            {{ sensors.temperature.value ?? '—' }}<span class="reading-unit">°C</span>
          </div>
          <div class="range-note">
            Rango configurado: {{ tempMin }}°C — {{ tempMax }}°C
          </div>
          <div class="range-indicator">
            <StatusDot :status="tempInRange ? 'ok' : 'warning'" />
            <span :class="tempInRange ? 'ok' : 'warn'">
              {{ tempInRange ? 'Dentro del rango de confort' : 'Fuera del rango de confort' }}
            </span>
          </div>
          <ProgressBar
            :value="((sensors.temperature.value - tempMin) / (tempMax - tempMin)) * 100"
            :color="tempInRange ? 'var(--green)' : 'var(--amber)'"
            :right-label="`${sensors.temperature.value}°C`"
          />
        </div>

        <div class="card reading-card">
          <div class="card-title">Humedad actual</div>
          <div class="reading-value">
            {{ sensors.humidity.value ?? '—' }}<span class="reading-unit">%</span>
          </div>
          <div class="range-note">
            Rango configurado: {{ humMin }}% — {{ humMax }}%
          </div>
          <div class="range-indicator">
            <StatusDot :status="humInRange ? 'ok' : 'warning'" />
            <span :class="humInRange ? 'ok' : 'warn'">
              {{ humInRange ? 'Dentro del rango de confort' : 'Fuera del rango de confort' }}
            </span>
          </div>
          <ProgressBar
            :value="((sensors.humidity.value - humMin) / (humMax - humMin)) * 100"
            :color="humInRange ? 'var(--green)' : 'var(--amber)'"
            :right-label="`${sensors.humidity.value}%`"
          />
        </div>

        <div class="card score-card">
          <div class="card-title">Puntuación de confort</div>
          <div class="score-value">{{ metrics.comfort_score.value ?? '—' }}</div>
          <div class="score-sub">/ 100</div>
        </div>
      </div>

      <!-- Config sliders -->
      <div class="config-col card">
        <div class="card-title">Configurar rangos de confort</div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">Temperatura mínima</span>
            <span class="slider-val">{{ tempMin }}°C</span>
          </div>
          <input type="range" v-model.number="tempMin" min="15" max="25" step="0.5" class="slider" />
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">Temperatura máxima</span>
            <span class="slider-val">{{ tempMax }}°C</span>
          </div>
          <input type="range" v-model.number="tempMax" min="20" max="30" step="0.5" class="slider" />
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">Humedad mínima</span>
            <span class="slider-val">{{ humMin }}%</span>
          </div>
          <input type="range" v-model.number="humMin" min="20" max="50" step="1" class="slider" />
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-label">Humedad máxima</span>
            <span class="slider-val">{{ humMax }}%</span>
          </div>
          <input type="range" v-model.number="humMax" min="40" max="80" step="1" class="slider" />
        </div>

        <button class="save-btn" :disabled="saving" @click="saveConfig">
          {{ saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar configuración' }}
        </button>

        <InsightBox
          text="Rangos actuales optimizados para clima mediterráneo veraniego. El sistema ajustará ventilación y protección solar para mantener estos parámetros."
        />
      </div>

    </div>
  </div>
</template>

<style scoped>
.confort { }
.confort-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }

.readings-col { display: flex; flex-direction: column; gap: 10px; }
.reading-card { display: flex; flex-direction: column; gap: 8px; }
.reading-value { font-size: 36px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.reading-unit  { font-size: 16px; font-weight: 500; color: var(--text-secondary); margin-left: 2px; }
.range-note    { font-size: 11px; color: var(--text-muted); }
.range-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; }
.range-indicator .ok   { color: var(--green); }
.range-indicator .warn { color: var(--amber); }

.score-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.score-value { font-size: 56px; font-weight: 700; letter-spacing: -2px; color: var(--green); line-height: 1; }
.score-sub   { font-size: 14px; color: var(--text-muted); font-weight: 500; }

.config-col { display: flex; flex-direction: column; gap: 16px; }

.slider-group { display: flex; flex-direction: column; gap: 6px; }
.slider-header { display: flex; justify-content: space-between; }
.slider-label  { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.slider-val    { font-size: 12px; font-weight: 700; color: var(--text); }
.slider {
  width: 100%;
  accent-color: var(--green);
  height: 4px;
  cursor: pointer;
}

.save-btn {
  width: 100%;
  padding: 10px;
  background: var(--green);
  color: #fff;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.save-btn:hover:not(:disabled) { background: var(--green-light); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
