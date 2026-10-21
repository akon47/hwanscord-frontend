<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { readJson, writeJson } from '@/utils/storage'

const props = defineProps<{ label: string; storageKey: string; count?: number }>()

const collapsed = ref(readJson<boolean>(`category.${props.storageKey}`, false))

function toggle() {
  collapsed.value = !collapsed.value
  writeJson(`category.${props.storageKey}`, collapsed.value)
}
</script>

<template>
  <section class="category">
    <div class="category-header">
      <button
        type="button"
        class="category-toggle"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <ChevronDown :size="12" class="chevron" :class="{ 'is-collapsed': collapsed }" />
        <span class="category-label truncate">{{ label }}</span>
      </button>
      <slot name="action" />
    </div>
    <div v-show="!collapsed" class="category-items">
      <slot />
    </div>
    <!-- collapsed categories still show unread/selected channels like Discord -->
    <div v-if="collapsed" class="category-items is-collapsed-view">
      <slot name="collapsed" />
    </div>
  </section>
</template>

<style scoped>
.category {
  margin-top: 16px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 2px;
  height: 24px;
  color: var(--text-muted);
}

.category-header:hover,
.category-header:hover .category-toggle {
  color: var(--interactive-hover);
}

.category-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  color: inherit;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: left;
}

.chevron {
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.chevron.is-collapsed {
  transform: rotate(-90deg);
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}
</style>
