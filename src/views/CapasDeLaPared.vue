<script setup>
import { ref, computed } from 'vue'
import { dummyWallSections } from '@/data/dummy'
import InsightBox  from '@/components/ui/InsightBox.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const selectedSlab = ref(null)

const floors  = ['3', '2', '1']
const sections = ['A', 'B', 'C']

function selectSlab(floor, section) {
  const key = `${floor}${section}`
  selectedSlab.value = selectedSlab.value?.key === key ? null : { key, ...dummyWallSections[key] }
}

function isSelected(floor, section) {
  return selectedSlab.value?.key === `${floor}${section}`
}

const layerColors = {
  'Ventilación':       '#378ADD',
  'Protección Solar':  '#EF9F27',
  'Agua Gris':         '#2470ba',
  'Energía Solar':     '#F5A623',
  'Confort Térmico':   '#1D9E75'
}

const layerMetrics = computed(() => {
  if (!selectedSlab.value) return []
  const s = selectedSlab.value
  return [
    { label: 'Temperatura', value: s.temp, unit: '°C' },
    { label: 'Humedad',     value: s.humidity, unit: '%' },
    { label: 'Ganancia solar', value: s.solar_gain, unit: 'W/m²' },
    { label: 'Flujo de aire',  value: s.air_flow,   unit: 'm/s' },
    { label: 'Aislamiento',    value: s.insulation,  unit: '%' }
  ]
})
</script>

<template>
  <div class="capas-layout">

    <!-- SVG Building -->
    <div class="building-panel card">
      <div class="card-title">Fachada — Cosentino HQ</div>
      <div class="building-wrap">
        <svg viewBox="0 0 360 400" class="building-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Building outline -->
          <rect x="20" y="20" width="320" height="360" rx="4" fill="var(--card-alt)" stroke="var(--border-strong)" stroke-width="1"/>

          <!-- Floor labels -->
          <text x="8" y="108" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle" transform="rotate(-90, 8, 108)">PLANTA 3</text>
          <text x="8" y="228" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle" transform="rotate(-90, 8, 228)">PLANTA 2</text>
          <text x="8" y="348" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle" transform="rotate(-90, 8, 348)">PLANTA 1</text>

          <!-- Section labels -->
          <text x="73"  y="15" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle">A</text>
          <text x="180" y="15" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle">B</text>
          <text x="287" y="15" font-size="9" fill="var(--text-muted)" font-family="Inter" font-weight="600" text-anchor="middle">C</text>

          <!-- Slabs (3 floors × 3 sections) -->
          <template v-for="(floor, fi) in floors" :key="floor">
            <template v-for="(sec, si) in sections" :key="sec">
              <!-- slab background -->
              <rect
                :x="22 + si * 107"
                :y="22 + fi * 120"
                width="104"
                height="116"
                rx="3"
                :fill="isSelected(floor, sec) ? 'rgba(29,158,117,0.18)' : 'var(--bg)'"
                :stroke="isSelected(floor, sec) ? 'var(--green)' : 'var(--border)'"
                :stroke-width="isSelected(floor, sec) ? 1.5 : 1"
                style="cursor: pointer; transition: fill 0.2s, stroke 0.2s;"
                @click="selectSlab(floor, sec)"
              />
              <!-- windows -->
              <rect :x="34 + si * 107" :y="36 + fi * 120"  width="36" height="28" rx="2" fill="var(--blue)" opacity="0.25" style="pointer-events:none;"/>
              <rect :x="78 + si * 107" :y="36 + fi * 120"  width="36" height="28" rx="2" fill="var(--blue)" opacity="0.25" style="pointer-events:none;"/>
              <rect :x="34 + si * 107" :y="74 + fi * 120"  width="36" height="28" rx="2" fill="var(--blue)" opacity="0.25" style="pointer-events:none;"/>
              <rect :x="78 + si * 107" :y="74 + fi * 120"  width="36" height="28" rx="2" fill="var(--blue)" opacity="0.25" style="pointer-events:none;"/>
              <!-- Selected indicator -->
              <circle
                v-if="isSelected(floor, sec)"
                :cx="74 + si * 107"
                :cy="80 + fi * 120"
                r="5"
                fill="var(--green)"
                opacity="0.9"
                style="pointer-events:none;"
              />
            </template>
          </template>
        </svg>
      </div>
    </div>

    <!-- Detail panel -->
    <div class="detail-panel">
      <div v-if="!selectedSlab" class="detail-empty card">
        <div class="empty-icon">🏢</div>
        <div class="empty-title">Selecciona una sección</div>
        <div class="empty-desc">Haz clic en cualquier bloque de la fachada para ver el detalle de esa capa.</div>
      </div>

      <template v-else>
        <div class="detail-header card">
          <StatusBadge :label="selectedSlab.layer" variant="blue" />
          <div class="detail-title">{{ selectedSlab.floor }} — Sección {{ selectedSlab.section }}</div>
          <div class="detail-sub">{{ selectedSlab.layer }} · Panel activo</div>
        </div>

        <div class="layer-metrics">
          <div v-for="m in layerMetrics" :key="m.label" class="layer-metric card">
            <div class="card-title">{{ m.label }}</div>
            <div class="layer-value">{{ m.value }}<span class="layer-unit">{{ m.unit }}</span></div>
          </div>
        </div>

        <InsightBox
          :text="`La sección ${selectedSlab.section} de ${selectedSlab.floor} opera en parámetros óptimos. La ganancia solar de ${selectedSlab.solar_gain} W/m² está siendo gestionada eficientemente por la capa de ${selectedSlab.layer}.`"
        />
      </template>
    </div>

  </div>
</template>

<style scoped>
.capas-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 16px;
  align-items: start;
}

.building-panel { }
.building-wrap { margin-top: 8px; }
.building-svg { width: 100%; height: auto; }

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 10px;
}
.empty-icon { font-size: 40px; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text); }
.empty-desc  { font-size: 12px; color: var(--text-muted); line-height: 1.6; max-width: 240px; }

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.detail-title { font-size: 18px; font-weight: 700; color: var(--text); }
.detail-sub   { font-size: 12px; color: var(--text-muted); }

.layer-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.layer-metric { display: flex; flex-direction: column; gap: 4px; }
.layer-value  { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
.layer-unit   { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-left: 2px; }

.detail-panel { display: flex; flex-direction: column; gap: 12px; }
</style>
