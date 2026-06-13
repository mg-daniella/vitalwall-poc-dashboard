<script setup>
import StatusDot from './StatusDot.vue'
defineProps({
  label:  { type: String,  required: true },
  value:  { type: [Number, String], default: null },
  unit:   { type: String,  default: '' },
  status: { type: String,  default: 'ok' },
  badge:  { type: String,  default: null }
})
</script>

<template>
  <div class="metric-card">
    <div class="metric-label">
      <span>{{ label }}</span>
      <StatusDot :status="status" />
    </div>
    <div class="metric-value" :class="status">
      {{ value != null ? value : '—' }}
    </div>
    <div class="metric-unit">{{ unit }}</div>
    <div v-if="badge" class="metric-badge" :class="status">{{ badge }}</div>
  </div>
</template>

<style scoped>
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 15px 16px;
}
.metric-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;
  display: flex; align-items: center; justify-content: space-between;
}
.metric-value {
  font-size: 32px; font-weight: 700; letter-spacing: -0.5px;
  line-height: 1; color: var(--text);
}
.metric-value.ok     { color: var(--text); }
.metric-value.warning { color: var(--amber); }
.metric-value.danger { color: var(--red); }
.metric-value.info   { color: var(--blue); }
.metric-unit { font-size: 11px; font-weight: 400; color: var(--text-secondary); margin-top: 4px; }
.metric-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;
  padding: 2px 7px; border-radius: 3px; margin-top: 6px;
}
.metric-badge.ok      { background: rgba(29,158,117,0.12); color: var(--green); }
.metric-badge.warning { background: rgba(239,159,39,0.12);  color: var(--amber); }
.metric-badge.danger  { background: rgba(226,75,74,0.12);   color: var(--red); }
.metric-badge.info    { background: rgba(55,138,221,0.12);  color: var(--blue-raw); }
</style>
