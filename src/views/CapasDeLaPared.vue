<script setup>
import { ref, computed } from 'vue'
import { dummyWallSections } from '@/data/dummy'
import InsightBox  from '@/components/ui/InsightBox.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const selectedSlab = ref(null)
const floors   = ['3', '2', '1']
const sections = ['A', 'B', 'C']

function selectSlab(floor, section) {
  const key = `${floor}${section}`
  selectedSlab.value = selectedSlab.value?.key === key ? null : { key, ...dummyWallSections[key] }
}
function isSelected(floor, section) {
  return selectedSlab.value?.key === `${floor}${section}`
}

// Colorblind-safe palette (no green/yellow/red)
const layerColor = {
  'Ventilación':      '#0071BC',
  'Protección Solar': '#0D9488',
  'Agua Gris':        '#134E4A',
  'Energía Solar':    '#5B9BD5',
  'Confort Térmico':  '#378ADD',
}

// Floating metric bubbles
const bubbles = computed(() => [
  { label: 'Temperatura', value: selectedSlab.value?.temp,       unit: '°C',   icon: 'ti-thermometer' },
  { label: 'Gan. solar',  value: selectedSlab.value?.solar_gain, unit: 'W/m²', icon: 'ti-sun'         },
  { label: 'Humedad',     value: selectedSlab.value?.humidity,   unit: '%',    icon: 'ti-droplet'     },
  { label: 'Flujo aire',  value: selectedSlab.value?.air_flow,   unit: 'm/s',  icon: 'ti-wind'        },
])

// Layer distribution across 9 slabs
const layerDistribution = computed(() => {
  const counts = {}
  Object.values(dummyWallSections).forEach(s => {
    counts[s.layer] = (counts[s.layer] || 0) + 1
  })
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / 9) * 100), color: layerColor[label] || '#0D9488' }))
    .sort((a, b) => b.count - a.count)
})

// All slabs sorted by insulation for the performance chart
const slabPerformance = computed(() =>
  Object.entries(dummyWallSections)
    .map(([key, s]) => ({
      key, label: `${s.floor.replace('Planta ','')}${s.section}`,
      insulation: s.insulation, layer: s.layer,
      color: layerColor[s.layer] || '#0D9488'
    }))
    .sort((a, b) => b.insulation - a.insulation)
)

const avgAirFlow = computed(() => {
  const vals = Object.values(dummyWallSections).map(s => s.air_flow)
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})
const avgInsulation = computed(() => {
  const vals = Object.values(dummyWallSections).map(s => s.insulation)
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

// SVG building constants
const SW = 158, SH = 98  // slab width/height
const OX = 42, OY = 22   // origin offset

function sx(si) { return OX + si * SW }
function sy(fi) { return OY + fi * SH }

// Windows: 3 cols × 2 rows per slab
const WIN_COLS = [10, 56, 102]
const WIN_ROWS = [10, 52]
const WIN_W = 42, WIN_H = 32
</script>

<template>
  <div class="view-inner capas-layout">

    <!-- ══ HERO: Building ══ -->
    <div class="building-hero card">

      <!-- Floating metric bubbles — left column -->
      <div class="bubbles-left" :class="{ active: !!selectedSlab }">
        <div v-for="b in bubbles" :key="b.label" class="metric-bubble">
          <i :class="`ti ${b.icon} bbl-icon`" aria-hidden="true"></i>
          <div class="bbl-value">
            {{ b.value != null ? b.value : '—' }}
            <span v-if="b.value != null" class="bbl-unit">{{ b.unit }}</span>
          </div>
          <div class="bbl-label">{{ b.label }}</div>
        </div>
      </div>

      <!-- Building SVG -->
      <div class="svg-wrap">
        <svg viewBox="0 0 518 320" class="bldg-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#EEF2F6"/>
              <stop offset="100%" stop-color="#E4EAF0"/>
            </linearGradient>
            <linearGradient id="facadeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#DDE4EC"/>
              <stop offset="40%"  stop-color="#F0F4F8"/>
              <stop offset="100%" stop-color="#DDE4EC"/>
            </linearGradient>
          </defs>

          <!-- Background sky -->
          <rect x="0" y="0" width="518" height="320" fill="url(#skyBg)"/>

          <!-- Ground shadow -->
          <ellipse cx="259" cy="314" rx="220" ry="7" fill="rgba(0,0,0,0.06)"/>

          <!-- Building body -->
          <rect :x="OX" :y="OY" width="474" height="296" fill="url(#facadeGrad)" rx="3"
                stroke="rgba(28,25,23,0.1)" stroke-width="0.8"/>

          <!-- Rooftop -->
          <rect :x="OX" y="12" width="474" height="14" fill="#C8D2DC" rx="2"/>
          <!-- Rooftop fixtures -->
          <rect x="75"  y="4"  width="48" height="12" rx="2" fill="#B8C4CE"/>
          <rect x="228" y="2"  width="64" height="12" rx="2" fill="#B8C4CE"/>
          <rect x="390" y="4"  width="48" height="12" rx="2" fill="#B8C4CE"/>
          <!-- Antenna -->
          <line x1="280" y1="2" x2="280" y2="12" stroke="#A8B4BF" stroke-width="1.5"/>
          <circle cx="280" cy="2" r="2" fill="#A8B4BF"/>

          <!-- Floor labels -->
          <text x="30" y="74"  font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="600"
                text-anchor="middle" transform="rotate(-90 30 74)">PLANTA 3</text>
          <text x="30" y="172" font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="600"
                text-anchor="middle" transform="rotate(-90 30 172)">PLANTA 2</text>
          <text x="30" y="270" font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="600"
                text-anchor="middle" transform="rotate(-90 30 270)">PLANTA 1</text>

          <!-- Section labels -->
          <text x="131" y="14" font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="700" text-anchor="middle">A</text>
          <text x="289" y="14" font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="700" text-anchor="middle">B</text>
          <text x="447" y="14" font-size="7.5" fill="#A8A29E" font-family="Inter" font-weight="700" text-anchor="middle">C</text>

          <!-- Slabs -->
          <template v-for="(floor, fi) in floors" :key="floor">
            <template v-for="(sec, si) in sections" :key="sec">
              <!-- Slab bg -->
              <rect
                :x="sx(si)" :y="sy(fi)" :width="SW - 2" :height="SH - 2" rx="2"
                :fill="isSelected(floor, sec) ? 'rgba(13,148,136,0.14)' : 'rgba(255,255,255,0.45)'"
                :stroke="isSelected(floor, sec) ? '#0D9488' : 'rgba(28,25,23,0.09)'"
                :stroke-width="isSelected(floor, sec) ? 1.5 : 0.7"
                style="cursor: pointer; transition: fill 0.18s, stroke 0.18s;"
                @click="selectSlab(floor, sec)"
              />
              <!-- Windows -->
              <template v-for="wr in WIN_ROWS" :key="wr">
                <template v-for="wc in WIN_COLS" :key="wc">
                  <rect
                    :x="sx(si) + wc" :y="sy(fi) + wr"
                    :width="WIN_W" :height="WIN_H" rx="1"
                    :fill="isSelected(floor, sec) ? 'rgba(13,148,136,0.22)' : 'rgba(13,148,136,0.09)'"
                    :stroke="isSelected(floor, sec) ? 'rgba(13,148,136,0.35)' : 'rgba(13,148,136,0.13)'"
                    stroke-width="0.5"
                    style="pointer-events: none;"
                  />
                  <!-- Window glare line -->
                  <line
                    :x1="sx(si) + wc + 3" :y1="sy(fi) + wr + 3"
                    :x2="sx(si) + wc + 3" :y2="sy(fi) + wr + WIN_H - 4"
                    stroke="rgba(255,255,255,0.5)" stroke-width="1"
                    style="pointer-events: none;"
                  />
                </template>
              </template>
              <!-- Selected layer label -->
              <text
                v-if="isSelected(floor, sec)"
                :x="sx(si) + (SW - 2) / 2" :y="sy(fi) + SH - 10"
                font-size="6.5" fill="#0D9488" font-family="Inter" font-weight="700"
                text-anchor="middle" style="pointer-events: none; letter-spacing: 0.3px;"
              >{{ dummyWallSections[`${floor}${sec}`]?.layer?.toUpperCase() }}</text>
            </template>
          </template>

          <!-- Floor separators -->
          <line :x1="OX" y1="120" :x2="OX+474" y2="120" stroke="rgba(28,25,23,0.07)" stroke-width="0.8"/>
          <line :x1="OX" y1="218" :x2="OX+474" y2="218" stroke="rgba(28,25,23,0.07)" stroke-width="0.8"/>
          <!-- Section separators -->
          <line x1="200" :y1="OY" x2="200" :y2="OY+296" stroke="rgba(28,25,23,0.07)" stroke-width="0.8"/>
          <line x1="358" :y1="OY" x2="358" :y2="OY+296" stroke="rgba(28,25,23,0.07)" stroke-width="0.8"/>

          <!-- Prompt text when nothing selected -->
          <text v-if="!selectedSlab" x="259" y="312" font-size="8.5" fill="#A8A29E"
                font-family="Inter" text-anchor="middle">
            Selecciona una sección para explorar
          </text>
        </svg>

        <!-- Selected slab badge -->
        <div v-if="selectedSlab" class="selected-badge">
          <i class="ti ti-stack-2" aria-hidden="true"></i>
          <span>{{ selectedSlab.floor }} · Sección {{ selectedSlab.section }} · <strong>{{ selectedSlab.layer }}</strong></span>
          <button class="clear-btn" @click="selectedSlab = null">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- IA Insight — right column -->
      <InsightBox
        text="Sección 3A registra la mayor ganancia solar (520 W/m²). Sistema de protección activo al 87% de capacidad."
        class="hero-insight"
      />
    </div>

    <!-- ══ BOTTOM: 3 cards ══ -->
    <div class="bottom-grid">

      <!-- Card 1: Rendimiento (like AQI chart) -->
      <div class="card perf-card">
        <div class="btm-title">Rendimiento por sección</div>
        <div class="btm-sub">Aislamiento térmico · % · haz clic para explorar</div>
        <div class="perf-list">
          <div
            v-for="s in slabPerformance" :key="s.key"
            class="perf-row"
            :class="{ highlighted: selectedSlab?.key === s.key }"
            @click="selectSlab(s.key[0], s.key[1])"
          >
            <div class="perf-meta">
              <span class="perf-key">{{ s.label }}</span>
              <span class="perf-layer-dot" :style="{ background: s.color }"></span>
            </div>
            <div class="perf-track">
              <div class="perf-fill" :style="{ width: s.insulation + '%', background: s.color }"></div>
            </div>
            <span class="perf-val">{{ s.insulation }}%</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Layer distribution (like Pollution Sources) -->
      <div class="card dist-card">
        <div class="btm-title">Distribución de capas</div>
        <div class="btm-sub">Composición de la fachada · 9 secciones activas</div>
        <div class="dist-list">
          <div v-for="l in layerDistribution" :key="l.label" class="dist-row">
            <i class="ti ti-stack-2 dist-icon" :style="{ color: l.color }" aria-hidden="true"></i>
            <span class="dist-label">{{ l.label }}</span>
            <div class="dist-track">
              <div class="dist-fill" :style="{ width: l.pct + '%', background: l.color }"></div>
            </div>
            <span class="dist-pct">{{ l.pct }}%</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Thermal / Air flow (like Wind Status) -->
      <div class="card thermal-card">
        <div class="btm-title">Estado Térmico</div>
        <div class="btm-sub">Promedio de todas las secciones</div>
        <div class="thermal-body">
          <!-- Compass rose -->
          <div class="compass-wrap">
            <svg viewBox="0 0 110 110" class="compass-svg" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55" cy="55" r="50" fill="none" stroke="var(--border)" stroke-width="1"/>
              <circle cx="55" cy="55" r="38" fill="none" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="2 3"/>
              <circle cx="55" cy="55" r="8"  fill="var(--card-alt)" stroke="var(--border)" stroke-width="1"/>
              <!-- Compass labels -->
              <text x="55"  y="8"   font-size="7.5" fill="var(--text-muted)" font-family="Inter" font-weight="700" text-anchor="middle">N</text>
              <text x="106" y="58"  font-size="7.5" fill="var(--text-muted)" font-family="Inter" font-weight="700" text-anchor="middle">E</text>
              <text x="55"  y="108" font-size="7.5" fill="var(--text-muted)" font-family="Inter" font-weight="700" text-anchor="middle">S</text>
              <text x="4"   y="58"  font-size="7.5" fill="var(--text-muted)" font-family="Inter" font-weight="700" text-anchor="middle">O</text>
              <!-- Tick marks -->
              <line v-for="deg in [0,30,60,90,120,150,180,210,240,270,300,330]" :key="deg"
                :x1="55 + 38 * Math.sin(deg * Math.PI/180)"
                :y1="55 - 38 * Math.cos(deg * Math.PI/180)"
                :x2="55 + 50 * Math.sin(deg * Math.PI/180)"
                :y2="55 - 50 * Math.cos(deg * Math.PI/180)"
                stroke="var(--border)" stroke-width="0.8"/>
              <!-- Needle — NE (45°) -->
              <line x1="55" y1="55"
                x2="55" y2="20"
                stroke="var(--blue-raw)" stroke-width="3" stroke-linecap="round"
                transform="rotate(45 55 55)"/>
              <line x1="55" y1="55"
                x2="55" y2="68"
                stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"
                transform="rotate(45 55 55)"/>
              <circle cx="55" cy="55" r="4" fill="var(--blue-raw)"/>
              <circle cx="55" cy="55" r="2" fill="white"/>
            </svg>
          </div>

          <div class="thermal-metrics">
            <div class="tm-item">
              <div class="tm-val">{{ avgAirFlow }}<span class="tm-unit">m/s</span></div>
              <div class="tm-lbl">Flujo de aire</div>
            </div>
            <div class="tm-div"></div>
            <div class="tm-item">
              <div class="tm-val">{{ avgInsulation }}<span class="tm-unit">%</span></div>
              <div class="tm-lbl">Aislamiento medio</div>
            </div>
            <div class="tm-div"></div>
            <div class="tm-item">
              <div class="tm-val">NE</div>
              <div class="tm-lbl">Dirección flujo</div>
            </div>
          </div>
        </div>

        <InsightBox
          text="Sección 3A registra la mayor ganancia solar (520 W/m²). Sistema de protección activo al 87% de capacidad."
        />
      </div>

    </div>

  </div>
</template>

<style scoped>
.capas-layout { display: flex; flex-direction: column; gap: 14px; }

/* ══ Hero ══ */
.building-hero {
  padding: 20px;
  min-height: 340px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
}

.svg-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}
.bldg-svg { width: 100%; max-width: 680px; height: auto; display: block; }

/* Metric bubbles column */
.bubbles-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0.4;
  transition: opacity 0.25s;
  flex-shrink: 0;
}
.bubbles-left.active { opacity: 1; }

/* IA Insight — right of building */
.hero-insight {
  width: 200px;
  flex-shrink: 0;
  align-self: stretch;
  height: auto !important;
}

.metric-bubble {
  width: 96px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-strong);
  border-radius: 50px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
html.dark .metric-bubble { background: rgba(44,42,39,0.92); }

.bbl-icon  { font-size: 20px; color: var(--blue-raw); }
.bbl-value { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; }
.bbl-unit  { font-size: 10px; color: var(--text-secondary); font-weight: 400; margin-left: 1px; }
.bbl-label { font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }

/* Selected slab badge */
.selected-badge {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 500; color: var(--blue-raw);
  background: rgba(13,148,136,0.07);
  border: 1px solid rgba(13,148,136,0.18);
  border-radius: 6px; padding: 8px 12px;
  margin-top: 8px;
}
.clear-btn {
  margin-left: auto; font-size: 13px; color: var(--text-muted);
  cursor: pointer; padding: 2px; display: flex;
}

/* ══ Bottom ══ */
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: start; }

.btm-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
.btm-sub   { font-size: 10px; color: var(--text-muted); margin: 3px 0 14px; }

/* Performance list */
.perf-card { padding: 18px; }
.perf-list { display: flex; flex-direction: column; gap: 7px; }
.perf-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 7px; border-radius: 5px; cursor: pointer;
  transition: background 0.15s;
}
.perf-row:hover    { background: var(--card-alt); }
.perf-row.highlighted { background: rgba(13,148,136,0.08); }
.perf-meta { display: flex; align-items: center; gap: 6px; width: 50px; flex-shrink: 0; }
.perf-key  { font-size: 11px; font-weight: 700; color: var(--text); }
.perf-layer-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.perf-track { flex: 1; height: 6px; background: var(--card-alt); border-radius: 3px; }
.perf-fill  { height: 100%; border-radius: 3px; transition: width 0.4s; opacity: 0.85; }
.perf-val   { font-size: 11px; font-weight: 700; color: var(--text); width: 32px; text-align: right; flex-shrink: 0; }

/* Distribution list */
.dist-card { padding: 18px; }
.dist-list { display: flex; flex-direction: column; gap: 13px; }
.dist-row  { display: flex; align-items: center; gap: 8px; }
.dist-icon { font-size: 14px; flex-shrink: 0; }
.dist-label{ font-size: 11px; font-weight: 500; color: var(--text-secondary); flex: 1; min-width: 0; }
.dist-track{ width: 80px; flex-shrink: 0; height: 5px; background: var(--card-alt); border-radius: 3px; }
.dist-fill { height: 100%; border-radius: 3px; opacity: 0.85; }
.dist-pct  { font-size: 12px; font-weight: 700; color: var(--text); width: 36px; text-align: right; flex-shrink: 0; }

/* Thermal card */
.thermal-card { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.thermal-body { display: flex; align-items: center; gap: 16px; }
.compass-wrap { flex-shrink: 0; }
.compass-svg  { width: 110px; height: 110px; display: block; }
.thermal-metrics { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.tm-item {}
.tm-val  { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; }
.tm-unit { font-size: 11px; color: var(--text-secondary); margin-left: 2px; }
.tm-lbl  { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-top: 1px; }
.tm-div  { height: 1px; background: var(--border); }

@media (max-width: 1100px) {
  .bottom-grid { grid-template-columns: 1fr 1fr; }
  .thermal-card { grid-column: 1 / -1; }
}
@media (max-width: 750px) {
  .building-hero { flex-direction: column; }
  .bottom-grid { grid-template-columns: 1fr; }
  .bubbles-left { flex-direction: row; flex-wrap: wrap; justify-content: center; }
  .metric-bubble { width: 80px; }
}
</style>
