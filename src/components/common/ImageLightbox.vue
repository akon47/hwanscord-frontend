<script setup lang="ts">
import { ref } from 'vue'
import { Download, ExternalLink, X, ZoomIn, ZoomOut } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import { useEscapeKey } from '@/composables/useEscapeKey'

const ui = useUiStore()
const zoomed = ref(false)

useEscapeKey(() => ui.closeLightbox())
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.lightbox" class="lightbox" @pointerdown.self="ui.closeLightbox()">
      <div class="toolbar">
        <span class="filename truncate">{{ ui.lightbox.filename }}</span>
        <button type="button" class="icon-btn" :aria-label="zoomed ? '축소' : '확대'" @click="zoomed = !zoomed">
          <component :is="zoomed ? ZoomOut : ZoomIn" :size="20" />
        </button>
        <a class="icon-btn" :href="ui.lightbox.url" target="_blank" rel="noopener" aria-label="새 탭에서 열기">
          <ExternalLink :size="20" />
        </a>
        <a class="icon-btn" :href="ui.lightbox.url" :download="ui.lightbox.filename" aria-label="다운로드">
          <Download :size="20" />
        </a>
        <button type="button" class="icon-btn" aria-label="닫기" @click="ui.closeLightbox()">
          <X :size="22" />
        </button>
      </div>
      <div class="stage" :class="{ 'is-zoomed': zoomed }" @pointerdown.self="ui.closeLightbox()">
        <img :src="ui.lightbox.url" :alt="ui.lightbox.filename" @click="zoomed = !zoomed" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 3500;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.88);
  animation: fade-in var(--transition-normal);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  color: #dbdee1;
}

.toolbar .icon-btn {
  color: #dbdee1;
}

.filename {
  flex: 1;
  font-size: var(--font-size-sm);
}

.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: auto;
  padding: 0 16px 16px;
}

.stage img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm);
  cursor: zoom-in;
  box-shadow: var(--shadow-high);
}

.stage.is-zoomed {
  align-items: flex-start;
  justify-content: flex-start;
}

.stage.is-zoomed img {
  max-width: none;
  max-height: none;
  cursor: zoom-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}
</style>
