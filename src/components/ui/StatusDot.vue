<script setup>
defineProps({
  status: { type: String, default: 'ok' } // ok | warning | danger
})
</script>

<template>
  <span class="status-dot" :class="status"></span>
</template>

<style scoped>
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.ok {
  background: var(--green);
  box-shadow: 0 0 4px rgba(29,158,117,0.6);
}
.status-dot.warning {
  background: var(--amber);
  box-shadow: 0 0 4px rgba(239,159,39,0.6);
}
.status-dot.danger {
  background: var(--red);
  box-shadow: 0 0 4px rgba(226,75,74,0.6);
}
.status-dot.info {
  background: var(--blue-raw);
  box-shadow: 0 0 4px rgba(55,138,221,0.6);
}
</style>
