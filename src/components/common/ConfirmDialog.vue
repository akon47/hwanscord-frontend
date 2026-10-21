<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import BaseModal from './BaseModal.vue'
import MessageItem from '@/components/chat/MessageItem.vue'

const ui = useUiStore()
</script>

<template>
  <BaseModal v-if="ui.confirm" :title="ui.confirm.title" @close="ui.resolveConfirm(false)">
    <p class="confirm-message">{{ ui.confirm.message }}</p>
    <div v-if="ui.confirm.preview" class="confirm-preview">
      <MessageItem :message="ui.confirm.preview" :grouped="false" readonly />
    </div>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="ui.resolveConfirm(false)">
        {{ ui.confirm.cancelLabel ?? '취소' }}
      </button>
      <button
        type="button"
        class="btn"
        :class="ui.confirm.danger ? 'btn-danger' : 'btn-primary'"
        autofocus
        @click="ui.resolveConfirm(true)"
      >
        {{ ui.confirm.confirmLabel ?? '확인' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-message {
  color: var(--text-normal);
  line-height: 1.5;
  white-space: pre-line;
}

.confirm-preview {
  margin-top: 16px;
  padding: 8px 0;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-low);
  pointer-events: none;
}
</style>
