<script setup>
import { ref, computed } from 'vue'
import { useRulesStore } from '@/stores/rules'

const rulesStore = useRulesStore()

// Per-card loading and error state
const inFlight   = ref({})
const cardErrors = ref({})

// Helpers
const LAYER_MAP = {
  ventilacion:      'Ventilación pasiva',
  proteccion_solar: 'Protección solar',
  energia:          'Energía y batería',
  agua:             'Gestión hídrica',
  confort_termico:  'Confort térmico',
  iluminacion:      'Iluminación',
  1: 'Capa 1 — Protección climática activa',
  2: 'Capa 2 — Gestión hídrica autónoma',
  3: 'Capa 3 — Regulación PCM inteligente',
  4: 'Capa 4 — Sensoría y edge computing',
  5: 'Capa 5 — Infraestructura interna',
}

const SOURCE_MAP = {
  IA:               'IA predictiva',
  AI_predictive:    'IA predictiva',
  grid_optimization:'Optimización de red',
}

function layerName(val) { return LAYER_MAP[val] || val || '—' }
function sourceLabel(val) { return SOURCE_MAP[val] || val || '—' }

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(iso) {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins}m`
  return `hace ${Math.floor(mins / 60)}h`
}

const activeCount = computed(() => rulesStore.activeRules.length + rulesStore.pendingRules.length)
const hasDecisions = computed(() => activeCount.value > 0 || rulesStore.recentRules.length > 0)

async function handleToggle(rule, newStatus) {
  inFlight.value = { ...inFlight.value, [rule.id]: true }
  delete cardErrors.value[rule.id]
  cardErrors.value = { ...cardErrors.value }
  try {
    await rulesStore.toggleRule(rule.id, newStatus)
    if (rulesStore.actionError?.id === rule.id) {
      cardErrors.value = { ...cardErrors.value, [rule.id]: rulesStore.actionError.message }
    }
  } finally {
    const next = { ...inFlight.value }
    delete next[rule.id]
    inFlight.value = next
  }
}
</script>

<template>
  <section class="ai-feed card">

    <!-- Section header -->
    <div class="feed-header">
      <div class="feed-title-row">
        <span class="feed-live-dot"></span>
        <span class="feed-title">Inteligencia Autónoma · En Tiempo Real</span>
      </div>
      <span class="feed-count" :class="activeCount > 0 ? 'count-active' : 'count-idle'">
        {{ activeCount > 0 ? `${activeCount} decisiones activas` : 'Sin decisiones activas' }}
      </span>
    </div>

    <!-- Loading skeleton -->
    <template v-if="rulesStore.loading">
      <div v-for="n in 2" :key="n" class="skeleton-card"></div>
    </template>

    <!-- Empty state -->
    <div v-else-if="!hasDecisions" class="empty-state">
      <span class="empty-dot"></span>
      Sistema operando de forma autónoma · Sin decisiones activas
    </div>

    <template v-else>

      <!-- ACTIVE rules -->
      <template v-if="rulesStore.activeRules.length">
        <div class="section-label">Ejecutándose ahora</div>
        <div
          v-for="rule in rulesStore.activeRules"
          :key="rule.id"
          class="rule-card status-active"
        >
          <div class="rule-top">
            <span class="rule-dot dot-active" :class="{ blink: true }"></span>
            <span class="rule-title">{{ rule.title }}</span>
            <span class="rule-time">{{ fmtTime(rule.triggered_at) }}</span>
          </div>

          <div class="rule-fields">
            <div class="rule-field">
              <span class="field-label">Por qué</span>
              <span class="field-val">{{ rule.condition || rule.description || '—' }}</span>
            </div>
            <div class="rule-field-row">
              <div class="rule-field half">
                <span class="field-label">Dónde</span>
                <span class="field-val">{{ layerName(rule.layer || rule.affected_layer) }}</span>
              </div>
              <div class="rule-field half">
                <span class="field-label">Cómo</span>
                <span class="field-val">{{ sourceLabel(rule.source || rule.trigger_source) }}</span>
              </div>
            </div>
            <div class="rule-field-row" v-if="rule.duration || rule.triggered_at">
              <div class="rule-field half" v-if="rule.duration">
                <span class="field-label">Duración</span>
                <span class="field-val">Estimada: {{ rule.duration }}</span>
              </div>
              <div class="rule-field half" v-if="rule.triggered_at">
                <span class="field-label">Iniciada</span>
                <span class="field-val elapsed">{{ relativeTime(rule.triggered_at) }}</span>
              </div>
            </div>
          </div>

          <div class="rule-controls">
            <button
              class="ctrl-btn pause"
              :disabled="inFlight[rule.id]"
              @click="handleToggle(rule, 'inactive')"
            >
              <span v-if="inFlight[rule.id]" class="spinner"></span>
              Pausar
            </button>
            <button
              class="ctrl-btn cancel"
              :disabled="inFlight[rule.id]"
              @click="handleToggle(rule, 'inactive')"
            >Cancelar</button>
          </div>
          <div v-if="cardErrors[rule.id]" class="rule-error">{{ cardErrors[rule.id] }}</div>
        </div>
      </template>

      <!-- PENDING rules -->
      <template v-if="rulesStore.pendingRules.length">
        <div class="section-label">Pendiente</div>
        <div
          v-for="rule in rulesStore.pendingRules"
          :key="rule.id"
          class="rule-card status-pending"
        >
          <div class="rule-top">
            <span class="rule-dot dot-pending"></span>
            <span class="rule-title">{{ rule.title }}</span>
            <span class="rule-time">{{ fmtTime(rule.triggered_at) }}</span>
          </div>

          <div class="rule-fields">
            <div class="rule-field">
              <span class="field-label">Por qué</span>
              <span class="field-val">{{ rule.condition || rule.description || '—' }}</span>
            </div>
            <div class="rule-field-row">
              <div class="rule-field half">
                <span class="field-label">Dónde</span>
                <span class="field-val">{{ layerName(rule.layer || rule.affected_layer) }}</span>
              </div>
              <div class="rule-field half">
                <span class="field-label">Cómo</span>
                <span class="field-val">{{ sourceLabel(rule.source || rule.trigger_source) }}</span>
              </div>
            </div>
          </div>

          <div class="rule-controls">
            <button
              class="ctrl-btn activate"
              :disabled="inFlight[rule.id]"
              @click="handleToggle(rule, 'active')"
            >
              <span v-if="inFlight[rule.id]" class="spinner"></span>
              Activar ahora
            </button>
            <button
              class="ctrl-btn cancel"
              :disabled="inFlight[rule.id]"
              @click="handleToggle(rule, 'inactive')"
            >Cancelar</button>
          </div>
          <div v-if="cardErrors[rule.id]" class="rule-error">{{ cardErrors[rule.id] }}</div>
        </div>
      </template>

      <!-- RECENT COMPLETED rules -->
      <template v-if="rulesStore.recentRules.length">
        <div class="section-label">Completada</div>
        <div
          v-for="rule in rulesStore.recentRules"
          :key="rule.id"
          class="rule-card status-completed"
        >
          <div class="rule-top">
            <span class="rule-dot dot-completed"></span>
            <span class="rule-title">{{ rule.title }}</span>
            <span class="rule-time">{{ fmtTime(rule.completed_at || rule.triggered_at) }}</span>
          </div>
          <div class="rule-fields">
            <div class="rule-field">
              <span class="field-label">Acción</span>
              <span class="field-val">{{ rule.condition || rule.description || '—' }}</span>
            </div>
            <div class="rule-field-row">
              <div class="rule-field half">
                <span class="field-label">Dónde</span>
                <span class="field-val">{{ layerName(rule.layer || rule.affected_layer) }}</span>
              </div>
              <div class="rule-field half" v-if="rule.duration">
                <span class="field-label">Duración</span>
                <span class="field-val">{{ rule.duration }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

    </template>
  </section>
</template>

<style scoped>
/* ── Container ─────────────────────────────────────────────── */
.ai-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Header ────────────────────────────────────────────────── */
.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.feed-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.feed-live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 5px rgba(29,158,117,0.7);
  animation: ai-blink 2s infinite;
  flex-shrink: 0;
}
@keyframes ai-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.feed-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}
.feed-count {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-badge);
}
.feed-count.count-active {
  background: rgba(55,138,221,0.1);
  color: var(--blue-raw);
}
.feed-count.count-idle {
  background: rgba(29,158,117,0.09);
  color: var(--green);
}

/* ── Section labels ────────────────────────────────────────── */
.section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ── Rule cards ────────────────────────────────────────────── */
.rule-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left-width: 3px;
}
.rule-card.status-active    { border-left-color: var(--blue-raw); background: rgba(55,138,221,0.02); }
.rule-card.status-pending   { border-left-color: var(--amber);   background: rgba(239,159,39,0.02); }
.rule-card.status-completed { border-left-color: var(--green);   background: rgba(29,158,117,0.02); }

/* ── Card top row ──────────────────────────────────────────── */
.rule-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rule-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-active    { background: var(--blue-raw); box-shadow: 0 0 6px rgba(55,138,221,0.6); }
.dot-pending   { background: var(--amber);   box-shadow: 0 0 4px rgba(239,159,39,0.5); }
.dot-completed { background: var(--green);   box-shadow: 0 0 4px rgba(29,158,117,0.5); }
.dot-active.blink { animation: ai-blink 2s infinite; }

.rule-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.rule-time {
  font-size: 10px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ── Fields ────────────────────────────────────────────────── */
.rule-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rule-field-row {
  display: flex;
  gap: 16px;
}
.rule-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rule-field.half { flex: 1; min-width: 0; }

.field-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--text-muted);
}
.field-val {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}
.field-val.elapsed { color: var(--blue-raw); font-weight: 500; }

/* ── Intervention controls ─────────────────────────────────── */
.rule-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ctrl-btn.pause:hover   { border-color: var(--amber); color: var(--amber); }
.ctrl-btn.cancel:hover  { border-color: var(--red);   color: var(--red); }
.ctrl-btn.activate:hover { border-color: var(--green); color: var(--green); }

.spinner {
  width: 9px; height: 9px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.rule-error {
  font-size: 11px;
  color: var(--red);
  margin-top: -4px;
}

/* ── Empty / loading states ────────────────────────────────── */
.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 0 6px;
  font-size: 13px;
  color: var(--green);
  font-weight: 500;
}
.empty-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 5px rgba(29,158,117,0.6);
  flex-shrink: 0;
}

.skeleton-card {
  height: 96px;
  background: var(--card-alt);
  border-radius: var(--radius-card);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
</style>
