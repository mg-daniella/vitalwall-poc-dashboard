<script setup>
defineProps({
  value:      { type: Number, default: 0 },
  color:      { type: String, default: 'var(--green)' },
  label:      { type: String, default: null },
  rightLabel: { type: String, default: null }
})
</script>

<template>
  <div class="progress-wrap">
    <div v-if="label || rightLabel" class="progress-labels">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-right">{{ rightLabel }}</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: Math.min(value,100) + '%', background: color }"></div>
    </div>
  </div>
</template>

<style scoped>
.progress-wrap { display: flex; flex-direction: column; gap: 5px; }
.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}
.progress-track {
  height: 5px;
  background: var(--card-alt);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
</style>
