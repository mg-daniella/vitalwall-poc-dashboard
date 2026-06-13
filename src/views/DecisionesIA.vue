<script setup>
import { ref, computed } from 'vue'
import { useRulesStore } from '@/stores/rules'
import StatusDot   from '@/components/ui/StatusDot.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ErrorState  from '@/components/ui/ErrorState.vue'
import { useToastsStore }   from '@/stores/toasts'
import { useRelativeTime } from '@/composables/useRelativeTime'

const toasts = useToastsStore()
const { relativeTime } = useRelativeTime()

const rules = useRulesStore()
const activeTab = ref('active')
const tabs = [
  { id: 'active',    label: 'Activas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' }
]

const displayRules = computed(() => {
  if (activeTab.value === 'active')    return rules.activeRules
  if (activeTab.value === 'pending')   return rules.pendingRules
  if (activeTab.value === 'completed') return rules.completedRules
  return []
})

// Override modal
const showModal    = ref(false)
const selectedRule = ref(null)
const overrideForm = ref({ descripcion: '', capa: '', duracion: 60, condicion: '', estado: 'active', motivo: '' })
const capas = ['ventilacion','proteccion_solar','energia','agua','confort_termico','iluminacion']

function openOverride(rule) {
  selectedRule.value = rule
  overrideForm.value = { descripcion: rule.description, capa: rule.layer || '', duracion: 60, condicion: '', estado: rule.status, motivo: '' }
  showModal.value = true
}

async function saveOverride() {
  if (!selectedRule.value) return
  if (!overrideForm.value.motivo.trim()) {
    toasts.error('El motivo del override es obligatorio')
    return
  }
  if (!overrideForm.value.duracion || overrideForm.value.duracion <= 0) {
    toasts.error('La duración debe ser mayor que 0')
    return
  }
  try {
    await rules.overrideRule(selectedRule.value.id, { ...overrideForm.value })
    toasts.success('Override aplicado correctamente')
    showModal.value = false
  } catch (err) {
    toasts.error('No se pudo guardar el override: ' + (err.message || 'error desconocido'))
  }
}

async function toggleRule(rule) {
  const newStatus = rule.status === 'active' ? 'pending' : 'active'
  await rules.toggleRule(rule.id, newStatus)
  if (rules.actionError?.id === rule.id) {
    toasts.error(rules.actionError.message)
  }
}

const scenarios = [
  { id:'heat', icon:'🌡', title:'Ola de calor', desc:'T > 35°C durante más de 3h. Activación refrigeración pasiva + lamas al máximo.', decisions: 4, variant:'amber' },
  { id:'fire', icon:'🔥', title:'Riesgo incendio', desc:'FWI > 30. Cierre de ventanas, alerta a servicios de emergencia, modo defensivo.', decisions: 6, variant:'red' },
  { id:'solar',icon:'⚡', title:'Excedente renovable', desc:'Solar > 80%. Redirigir excedente a batería y venta a red si aplica.', decisions: 3, variant:'green' }
]
</script>

<template>
  <div class="view-inner decisiones">

    <!-- Override banner -->
    <div class="override-banner">
      <StatusBadge label="Override disponible" variant="blue" />
      <span class="banner-text">Puedes modificar manualmente cualquier regla activa del sistema.</span>
    </div>

    <!-- Scenarios -->
    <div class="scenarios-grid">
      <div v-for="sc in scenarios" :key="sc.id" class="scenario-card" :class="sc.variant">
        <div class="scenario-icon">{{ sc.icon }}</div>
        <div class="scenario-body">
          <div class="scenario-title">{{ sc.title }}</div>
          <div class="scenario-desc">{{ sc.desc }}</div>
        </div>
        <div class="scenario-footer">El sistema tomará {{ sc.decisions }} decisiones</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs" :key="tab.id"
        class="tab-btn" :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </div>

    <!-- Rules list -->
    <div class="rules-list">
      <div v-if="rules.loading" class="loading-state">Cargando reglas…</div>
      <ErrorState
        v-else-if="rules.error"
        :message="rules.error.message"
        :status="rules.error.status"
        :retry-exhausted="rules.error.retryExhausted"
        :retrying="rules.retrying"
        @retry="rules.retry()"
      />
      <div v-else-if="!displayRules.length" class="empty-state">Sin reglas en este estado.</div>
      <div v-for="rule in displayRules" :key="rule.id" class="rule-card card">
        <div class="rule-card-header">
          <StatusDot :status="rule.status === 'active' ? 'ok' : 'info'" />
          <span class="rule-card-title">{{ rule.title }}</span>
          <div class="rule-actions" v-if="activeTab !== 'completed'">
            <button class="action-btn override-btn" @click="openOverride(rule)">Override</button>
            <button class="action-btn toggle-btn" :class="rule.status === 'active' ? 'deactivate' : 'activate'" @click="toggleRule(rule)">
              {{ rule.status === 'active' ? 'Desactivar' : 'Activar ya' }}
            </button>
          </div>
        </div>
        <div class="rule-card-desc">{{ rule.description }}</div>
        <div class="rule-card-tags">
          <StatusBadge :label="rule.status" :variant="rule.status === 'active' ? 'green' : rule.status === 'completed' ? 'gray' : 'blue'" />
          <StatusBadge v-if="rule.layer"    :label="rule.layer"    variant="gray" />
          <StatusBadge v-if="rule.source"   :label="rule.source"   variant="blue" />
          <StatusBadge v-if="rule.duration" :label="rule.duration" variant="gray" />
          <span class="rule-time">{{ relativeTime(rule.triggered_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Override modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Override Manual</span>
            <button class="modal-close" @click="showModal = false">✕</button>
          </div>
          <div class="modal-audit">
            ⚠ Este cambio quedará registrado en el log de auditoría del sistema.
          </div>
          <div class="modal-body">
            <label class="form-label">Descripción
              <textarea v-model="overrideForm.descripcion" class="form-input" rows="2"></textarea>
            </label>
            <label class="form-label">Capa
              <select v-model="overrideForm.capa" class="form-input">
                <option v-for="c in capas" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="form-label">Duración (minutos)
              <input v-model.number="overrideForm.duracion" type="number" class="form-input" />
            </label>
            <label class="form-label">Condición
              <input v-model="overrideForm.condicion" type="text" class="form-input" placeholder="ej: temp > 32°C" />
            </label>
            <label class="form-label">Estado
              <select v-model="overrideForm.estado" class="form-input">
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="pending">Pendiente</option>
              </select>
            </label>
            <label class="form-label">Motivo del override
              <textarea v-model="overrideForm.motivo" class="form-input" rows="2" placeholder="Explica el motivo…"></textarea>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showModal = false">Cancelar</button>
            <button class="btn-save"   @click="saveOverride">Guardar override</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.decisiones { display: flex; flex-direction: column; gap: 14px; }

.override-banner {
  display: flex; align-items: center; gap: 10px;
  background: rgba(55,138,221,0.07);
  border: 1px solid rgba(55,138,221,0.18);
  border-radius: var(--radius-card);
  padding: 10px 14px;
}
.banner-text { font-size: 12px; color: var(--text-secondary); }

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 12px;
}
.scenario-card {
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--card-bg);
}
.scenario-card.amber { border-color: rgba(239,159,39,0.3); background: rgba(239,159,39,0.04); }
.scenario-card.red   { border-color: rgba(226,75,74,0.3);  background: rgba(226,75,74,0.04); }
.scenario-card.green { border-color: rgba(29,158,117,0.3); background: rgba(29,158,117,0.04); }
.scenario-icon { font-size: 24px; }
.scenario-title { font-size: 13px; font-weight: 700; color: var(--text); }
.scenario-desc  { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }
.scenario-footer { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 8px; margin-top: auto; }

.tabs-bar { display: flex; gap: 0; border-bottom: 2px solid var(--border); }
.tab-btn {
  padding: 8px 18px;
  font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }
.tab-btn:hover  { color: var(--text); }

.rules-list { display: flex; flex-direction: column; gap: 8px; }
.rule-card { display: flex; flex-direction: column; gap: 8px; }
.rule-card-header {
  display: flex; align-items: center; gap: 8px;
}
.rule-card-title { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); }
.rule-actions { display: flex; gap: 6px; }
.action-btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px; font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: all 0.15s;
}
.override-btn { color: var(--blue-raw); border-color: rgba(55,138,221,0.3); }
.override-btn:hover { background: rgba(55,138,221,0.1); }
.toggle-btn.deactivate { color: var(--red); border-color: rgba(226,75,74,0.3); }
.toggle-btn.deactivate:hover { background: rgba(226,75,74,0.1); }
.toggle-btn.activate { color: var(--green); border-color: rgba(29,158,117,0.3); }
.toggle-btn.activate:hover { background: rgba(29,158,117,0.1); }
.rule-card-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.rule-card-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.rule-time { font-size: 10px; color: var(--text-muted); }

.loading-state, .empty-state { padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--card-bg);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 14px; font-weight: 700; color: var(--text); }
.modal-close { font-size: 14px; color: var(--text-muted); padding: 4px; }
.modal-close:hover { color: var(--text); }
.modal-audit {
  background: rgba(239,159,39,0.08);
  border-bottom: 1px solid rgba(239,159,39,0.2);
  padding: 10px 20px;
  font-size: 11px;
  color: var(--amber);
  font-weight: 500;
}
.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.form-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: flex; flex-direction: column; gap: 5px; }
.form-input {
  background: var(--card-alt);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--text);
  resize: vertical;
}
.form-input:focus { outline: none; border-color: var(--green); }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
}
.btn-cancel {
  padding: 7px 16px; border-radius: 5px;
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-save {
  padding: 7px 16px; border-radius: 5px;
  font-size: 12px; font-weight: 600;
  background: var(--green); color: #fff;
}
.btn-save:hover { background: var(--green-light); }
</style>
