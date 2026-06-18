<script setup>
defineProps({
  label:   { type: String, required: true },
  variant: { type: String, default: 'gray' } // green | amber | red | blue | teal | gray
})
</script>

<template>
  <span class="status-badge" :class="variant">{{ label }}</span>
</template>

<style scoped>
.status-badge {
  font-size: 10px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;
  padding: 2px 7px; border-radius: 3px; display: inline-flex; align-items: center;
}
.status-badge.green { background: rgba(29,158,117,0.14); color: var(--green); }
.status-badge.amber { background: rgba(239,159,39,0.14);  color: var(--amber); }
.status-badge.red   { background: rgba(226,75,74,0.14);   color: var(--red); }
.status-badge.blue  { background: rgba(55,138,221,0.14);  color: var(--blue-raw); }
.status-badge.teal  { background: rgba(0,128,128,0.12);   color: var(--teal); }
.status-badge.gray  { background: var(--card-alt); color: var(--text-muted); }
</style>
