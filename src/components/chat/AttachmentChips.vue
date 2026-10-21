<script setup lang="ts">
import { FileText, X } from '@lucide/vue'
import type { PendingAttachment } from '@/composables/useAttachmentUploads'
import { formatBytes } from '@/utils/format'

defineProps<{ items: PendingAttachment[] }>()
const emit = defineEmits<{ remove: [localId: string] }>()
</script>

<template>
  <div class="chips">
    <div v-for="item in items" :key="item.localId" class="chip" :class="{ 'is-error': item.error }">
      <div class="thumb">
        <img v-if="item.previewUrl" :src="item.previewUrl" alt="" />
        <FileText v-else :size="36" />
      </div>
      <div class="chip-text">
        <span class="chip-name truncate">{{ item.file.name }}</span>
        <span class="chip-size">{{ formatBytes(item.file.size) }}</span>
        <span v-if="item.error" class="chip-error">{{ item.error }}</span>
      </div>
      <div v-if="!item.attachment && !item.error" class="progress" :style="{ width: `${Math.round(item.progress * 100)}%` }" />
      <button type="button" class="remove" aria-label="첨부 파일 제거" @click="emit('remove', item.localId)">
        <X :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  gap: 12px;
  padding: 12px 12px 4px;
  overflow-x: auto;
}

.chip {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 180px;
  flex-shrink: 0;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-strong);
  overflow: hidden;
}

.chip.is-error {
  border-color: var(--red);
}

.thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-muted);
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chip-text {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  font-size: var(--font-size-sm);
}

.chip-size,
.chip-error {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.chip-error {
  color: var(--red);
}

.progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: var(--brand);
  transition: width var(--transition-fast);
}

.remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--interactive-normal);
  box-shadow: var(--shadow-low);
}

.remove:hover {
  color: var(--red);
}
</style>
