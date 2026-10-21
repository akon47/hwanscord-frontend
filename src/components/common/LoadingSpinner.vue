<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 32, label: '불러오는 중' })
</script>

<template>
  <div class="spinner" role="status" :aria-label="label">
    <span class="ring" :style="{ width: `${size}px`, height: `${size}px` }" />
  </div>
</template>

<style scoped>
.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.ring {
  display: inline-block;
  border-radius: 50%;
  border: 3px solid var(--bg-modifier-selected);
  border-top-color: var(--brand);
  animation: spin 0.8s linear infinite;
}
</style>
