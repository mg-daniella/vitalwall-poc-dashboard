<script setup>
defineProps({
  text: { type: String, required: true }
})
</script>

<template>
  <div class="insight-box">
    <div class="insight-label">
      <span>✦</span>
      <span>IA Insight</span>
    </div>
    <div class="insight-text">{{ text }}</div>
  </div>
</template>

<style scoped>
.insight-box {
  background: rgba(29,158,117,0.07);
  border: 1px solid rgba(29,158,117,0.18);
  border-radius: 5px;
  padding: 12px 14px;
}
.insight-label {
  font-size: 9px; font-weight: 600; letter-spacing: 1px;
  text-transform: uppercase; color: var(--green-light);
  margin-bottom: 5px; display: flex; align-items: center; gap: 5px;
}
.insight-text { font-size: 12px; font-weight: 400; color: var(--text-secondary); line-height: 1.65; }
html.dark .insight-label { color: var(--green-light); }
</style>
