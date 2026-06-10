<script setup>
defineProps({
  text: { type: String, required: true }
})
</script>

<template>
  <div class="insight-box">
    <span class="insight-icon">✦</span>
    <span class="insight-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.insight-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(29,158,117,0.08);
  border: 1px solid rgba(29,158,117,0.2);
  border-radius: var(--radius-insight);
  padding: 10px 12px;
}
.insight-icon {
  font-size: 12px;
  color: var(--green);
  flex-shrink: 0;
  margin-top: 1px;
}
.insight-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--green);
  line-height: 1.5;
}
html.dark .insight-box {
  background: rgba(93,202,165,0.08);
  border-color: rgba(93,202,165,0.2);
}
html.dark .insight-icon,
html.dark .insight-text {
  color: var(--green-light);
}
</style>
