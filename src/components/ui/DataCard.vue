<script setup>
defineProps({
  title:    { type: String, required: true },
  linkText: { type: String, default: null },
  linkTo:   { type: String, default: null }
})
</script>

<template>
  <div class="data-card">
    <div class="data-card-title">
      <span>{{ title }}</span>
      <RouterLink v-if="linkText && linkTo" :to="linkTo" class="link-btn">
        {{ linkText }} →
      </RouterLink>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.data-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 18px 20px;
}
.data-card-title {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px; margin-bottom: 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.link-btn {
  font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
  text-transform: uppercase; color: var(--green);
  transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }
</style>
