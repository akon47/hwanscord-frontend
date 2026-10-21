<script setup lang="ts">
defineProps<{ label: string; variant?: 'date' | 'new' }>()
</script>

<template>
  <div class="divider" :class="{ 'is-new': variant === 'new' }" role="separator">
    <span class="line" />
    <span class="label">{{ label }}</span>
    <span class="line" />
  </div>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 16px 4px;
}

.line {
  flex: 1;
  height: 1px;
  background: var(--divider);
}

.label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.is-new {
  margin-top: 8px;
}

.is-new .line {
  background: var(--red);
}

.is-new .label {
  color: var(--red);
}
</style>
