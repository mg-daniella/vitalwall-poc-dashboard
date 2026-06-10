<script setup>
defineProps({
  label:   { type: String, required: true },
  variant: { type: String, default: 'green' } // green | amber | red | blue | gray
})
</script>

<template>
  <span class="badge" :class="variant">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: var(--radius-badge);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.badge.green  { background: rgba(29,158,117,0.12); color: var(--green); }
.badge.amber  { background: rgba(239,159,39,0.12);  color: var(--amber); }
.badge.red    { background: rgba(226,75,74,0.12);   color: var(--red); }
.badge.blue   { background: rgba(55,138,221,0.12);  color: var(--blue-raw); }
.badge.gray   { background: var(--card-alt);         color: var(--text-muted); }

html.dark .badge.green { background: rgba(93,202,165,0.15); color: var(--green-light); }
</style>
