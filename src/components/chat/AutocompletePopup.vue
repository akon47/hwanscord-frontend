<script setup lang="ts">
import { watch } from 'vue'
import UserAvatar from '@/components/users/UserAvatar.vue'

export interface AutocompleteItem {
  id: string
  label: string
  description?: string
  emoji?: string
  avatar?: { userId: string; displayName: string; avatarUrl: string | null }
}

const props = defineProps<{ title: string; items: AutocompleteItem[]; activeIndex: number }>()
const emit = defineEmits<{ select: [item: AutocompleteItem]; hover: [index: number] }>()

watch(
  () => props.activeIndex,
  (index) => {
    document.getElementById(`ac-item-${index}`)?.scrollIntoView({ block: 'nearest' })
  },
)
</script>

<template>
  <div class="autocomplete" role="listbox" :aria-label="title">
    <h4 class="title">{{ title }}</h4>
    <ul class="list scroller-thin">
      <li
        v-for="(item, index) in items"
        :id="`ac-item-${index}`"
        :key="item.id"
        role="option"
        class="item"
        :class="{ 'is-active': index === activeIndex }"
        :aria-selected="index === activeIndex"
        @mousedown.prevent="emit('select', item)"
        @mouseenter="emit('hover', index)"
      >
        <span v-if="item.emoji" class="emoji">{{ item.emoji }}</span>
        <UserAvatar
          v-else-if="item.avatar"
          :user-id="item.avatar.userId"
          :display-name="item.avatar.displayName"
          :avatar-url="item.avatar.avatarUrl"
          :size="24"
        />
        <span class="label truncate">{{ item.label }}</span>
        <span v-if="item.description" class="description truncate">{{ item.description }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.autocomplete {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 40;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--bg-floating);
  box-shadow: var(--shadow-high);
}

.title {
  padding: 4px 8px 6px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.list {
  max-height: 240px;
  overflow-y: auto;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  color: var(--text-normal);
  cursor: pointer;
}

.item.is-active {
  background: var(--bg-modifier-selected);
  color: var(--header-primary);
}

.emoji {
  width: 24px;
  font-size: 1.25rem;
  text-align: center;
  line-height: 1;
}

.label {
  font-weight: 500;
}

.description {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
</style>
