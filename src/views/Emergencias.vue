<script setup>
import StatusBadge from '@/components/ui/StatusBadge.vue'
import InsightBox  from '@/components/ui/InsightBox.vue'

const emergencyCodes = [
  'storm_warning','earthquake','flood_warning',
  'extreme_heat','extreme_cold','wildfire_nearby','air_quality_hazardous'
]

// Static dummy: no active external emergencies
const activeEmergencies = []

const emergencyInfo = {
  storm_warning:           { icon: '⛈', label: 'Alerta de tormenta',      color: 'amber' },
  earthquake:              { icon: '🏚', label: 'Terremoto',               color: 'red' },
  flood_warning:           { icon: '🌊', label: 'Alerta de inundación',    color: 'blue' },
  extreme_heat:            { icon: '🌡', label: 'Calor extremo',           color: 'red' },
  extreme_cold:            { icon: '🧊', label: 'Frío extremo',            color: 'blue' },
  wildfire_nearby:         { icon: '🔥', label: 'Incendio próximo',        color: 'red' },
  air_quality_hazardous:   { icon: '☣', label: 'Calidad aire peligrosa',  color: 'red' }
}

const monitoredSources = [
  { name: 'AEMET', desc: 'Alertas meteorológicas', status: 'ok' },
  { name: 'EFFIS', desc: 'Sistema europeo información incendios', status: 'ok' },
  { name: 'IGME',  desc: 'Actividad sísmica',       status: 'ok' },
  { name: 'SAIH',  desc: 'Alertas hidrológicas',    status: 'ok' }
]
</script>

<template>
  <div class="view-inner emergencias">

    <InsightBox
      text="Sin emergencias externas activas. Todos los sistemas de monitorización operativos. Última verificación: hace menos de 5 minutos."
    />

    <!-- Emergency type grid -->
    <div class="em-types-grid">
      <div
        v-for="code in emergencyCodes" :key="code"
        class="em-type-card card"
      >
        <span class="em-icon">{{ emergencyInfo[code].icon }}</span>
        <div class="em-label">{{ emergencyInfo[code].label }}</div>
        <StatusBadge label="Normal" variant="green" />
      </div>
    </div>

    <!-- Active emergencies (empty state) -->
    <div v-if="!activeEmergencies.length" class="no-em card">
      <div class="no-em-icon">🛡</div>
      <div class="no-em-title">Sin emergencias externas activas</div>
      <div class="no-em-desc">
        El sistema monitoriza continuamente las alertas de AEMET, EFFIS, IGME y SAIH.
        No se han detectado eventos de emergencia en tu área.
      </div>
    </div>

    <!-- Monitored sources -->
    <div class="card">
      <div class="card-title">Fuentes de emergencia monitorizadas</div>
      <div v-for="src in monitoredSources" :key="src.name" class="src-row">
        <div class="src-dot" :class="src.status"></div>
        <div class="src-body">
          <div class="src-name">{{ src.name }}</div>
          <div class="src-desc">{{ src.desc }}</div>
        </div>
        <StatusBadge label="Activo" variant="green" />
      </div>
    </div>

    <!-- Protocol -->
    <div class="card protocol-card">
      <div class="card-title">Protocolo de emergencia VitalWall</div>
      <div class="protocol-steps">
        <div class="p-step"><span class="p-num">1</span><span>El sistema detecta la alerta de la fuente oficial</span></div>
        <div class="p-step"><span class="p-num">2</span><span>Se activa el modo defensivo automáticamente</span></div>
        <div class="p-step"><span class="p-num">3</span><span>Se notifica al responsable técnico vía WebSocket</span></div>
        <div class="p-step"><span class="p-num">4</span><span>Las reglas IA se adaptan al tipo de emergencia</span></div>
        <div class="p-step"><span class="p-num">5</span><span>Se registra todo en el log de auditoría</span></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.emergencias { display: flex; flex-direction: column; gap: 14px; }

.em-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.em-type-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 16px 10px; text-align: center;
}
.em-icon  { font-size: 28px; }
.em-label { font-size: 11px; font-weight: 600; color: var(--text); }

.no-em { text-align: center; padding: 40px 24px; }
.no-em-icon  { font-size: 40px; margin-bottom: 10px; }
.no-em-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.no-em-desc  { font-size: 12px; color: var(--text-muted); line-height: 1.7; max-width: 380px; margin: 0 auto; }

.src-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.src-row:last-child { border-bottom: none; }
.src-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.src-dot.ok { background: var(--green); box-shadow: 0 0 4px rgba(29,158,117,0.6); }
.src-body { flex: 1; }
.src-name { font-size: 13px; font-weight: 600; color: var(--text); }
.src-desc { font-size: 11px; color: var(--text-muted); }

.protocol-card {}
.protocol-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.p-step { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: var(--text-secondary); }
.p-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--card-alt);
  color: var(--text);
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
</style>
