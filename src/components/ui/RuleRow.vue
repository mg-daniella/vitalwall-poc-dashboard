<script setup>
import StatusDot from './StatusDot.vue'
import StatusBadge from './StatusBadge.vue'
import { ACTION_VARIANT } from '@/stores/rules'

defineProps({
  rule: { type: Object, required: true }
})

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs/24)}d`
}

const statusVariant = { active: 'green', pending: 'blue', completed: 'gray', inactive: 'gray' }
</script>

<template>
  <div class="rule-row">
    <StatusDot :status="rule.status === 'active' ? 'ok' : rule.status === 'pending' ? 'info' : 'ok'" />
    <div class="rule-body">
      <div class="rule-title">{{ rule.title }}</div>
      <div class="rule-meta">
        <StatusBadge :label="rule.status" :variant="statusVariant[rule.status] || 'gray'" />
        <StatusBadge v-if="rule.action_type" :label="rule.action_type" :variant="ACTION_VARIANT[rule.action_type] || 'gray'" />
        <StatusBadge v-if="rule.layer" :label="rule.layer" variant="gray" />
        <StatusBadge v-if="rule.source" :label="rule.source" variant="blue" />
        <span class="rule-time">{{ relativeTime(rule.triggered_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.rule-row:last-child { border-bottom: none; }
.rule-body { flex: 1; min-width: 0; }
.rule-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rule-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.rule-time {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 2px;
}
</style>
