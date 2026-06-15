<script setup>
defineProps({
  text: { type: String, required: true }
})
</script>

<template>
  <div class="insight-box">
    <div class="insight-label">
      <i class="ti ti-sparkles" aria-hidden="true"></i>
      <span>IA Insight</span>
    </div>
    <div class="insight-text">{{ text }}</div>
  </div>
</template>

<style scoped>
.insight-box {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-left: 3px solid var(--blue-raw);
  border-radius: 6px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.08);
}
.insight-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: var(--blue-raw);
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.insight-label .ti { font-size: 13px; }
.insight-text {
  font-size: 14px; font-weight: 400;
  color: var(--text);
  line-height: 1.75;
}
</style>
