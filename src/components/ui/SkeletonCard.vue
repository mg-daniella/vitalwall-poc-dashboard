<script setup>
defineProps({
  height: { type: String, default: '90px' }
})
</script>

<template>
  <div class="skeleton-card" :style="{ height }">
    <div class="skeleton-line short"></div>
    <div class="skeleton-line long"></div>
    <div class="skeleton-line medium"></div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--card-alt) 25%, var(--border-strong) 50%, var(--card-alt) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-line.short  { width: 35%; }
.skeleton-line.long   { width: 80%; height: 28px; margin-top: 6px; }
.skeleton-line.medium { width: 55%; }
</style>
