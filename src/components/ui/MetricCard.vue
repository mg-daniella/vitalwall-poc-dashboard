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
    <div class="card-header">
      <span class="card-title">{{ label }}</span>
      <StatusDot :status="status" />
    </div>
    <div class="value-row">
      <span class="metric-value" :class="status">
        {{ value !== null ? value : '—' }}
      </span>
      <span v-if="unit" class="metric-unit">{{ unit }}</span>
    </div>
    <div v-if="badge" class="badge-row">
      <span class="status-text" :class="status">{{ badge }}</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}
.value-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.metric-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1;
  color: var(--text);
}
.metric-value.warning { color: var(--amber); }
.metric-value.danger  { color: var(--red); }
.metric-value.ok      { color: var(--text); }

.metric-unit {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.status-text {
  font-size: 11px;
  font-weight: 500;
}
.status-text.ok      { color: var(--green); }
.status-text.warning { color: var(--amber); }
.status-text.danger  { color: var(--red); }
</style>
