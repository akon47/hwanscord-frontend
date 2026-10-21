<script setup lang="ts">
import { Download, FileText } from '@lucide/vue'
import type { Attachment } from '@/api'
import { useUiStore } from '@/stores/ui'
import { formatBytes, isAudioType, isImageType, isVideoType } from '@/utils/format'

defineProps<{ attachments: Attachment[] }>()
const ui = useUiStore()

function imageStyle(a: Attachment): Record<string, string> {
  if (!a.width || !a.height) return {}
  const maxW = 400
  const maxH = 300
  const ratio = Math.min(maxW / a.width, maxH / a.height, 1)
  return { width: `${Math.round(a.width * ratio)}px`, aspectRatio: `${a.width} / ${a.height}` }
}
</script>

<template>
  <div class="attachments">
    <template v-for="attachment in attachments" :key="attachment.id">
      <button
        v-if="isImageType(attachment.contentType)"
        type="button"
        class="image"
        :style="imageStyle(attachment)"
        :aria-label="`이미지 ${attachment.filename} 크게 보기`"
        @click="ui.openLightbox(attachment.url, attachment.filename)"
      >
        <img :src="attachment.url" :alt="attachment.filename" loading="lazy" />
      </button>
      <video v-else-if="isVideoType(attachment.contentType)" class="video" :src="attachment.url" controls preload="metadata" />
      <div v-else-if="isAudioType(attachment.contentType)" class="file">
        <audio :src="attachment.url" controls preload="metadata" class="audio" />
      </div>
      <div v-else class="file">
        <FileText :size="32" class="file-icon" />
        <span class="file-text">
          <a :href="attachment.url" target="_blank" rel="noopener" class="file-name truncate">{{ attachment.filename }}</a>
          <span class="file-size">{{ formatBytes(attachment.size) }}</span>
        </span>
        <a :href="attachment.url" :download="attachment.filename" class="icon-btn" aria-label="다운로드">
          <Download :size="20" />
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.image {
  display: block;
  max-width: min(400px, 100%);
  max-height: 300px;
  overflow: hidden;
  border-radius: var(--radius-md);
  cursor: zoom-in;
  background: var(--bg-secondary);
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video {
  max-width: min(480px, 100%);
  max-height: 320px;
  border-radius: var(--radius-md);
  background: #000;
}

.file {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(420px, 100%);
  padding: 10px 12px;
  border: 1px solid var(--divider-strong);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.file-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.file-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.audio {
  width: 100%;
  height: 36px;
}
</style>
