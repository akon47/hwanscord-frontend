<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useAutoResize } from '@/composables/useAutoResize'
import { toEditableContent, toRawContent } from '@/utils/mentions'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{ done: [] }>()

const messages = useMessagesStore()
const users = useUsersStore()
const ui = useUiStore()

const textarea = ref<HTMLTextAreaElement | null>(null)
const text = ref(toEditableContent(props.message.content, users.mentionTargets))
const saving = ref(false)
useAutoResize(textarea, text, 300)

onMounted(() => {
  const el = textarea.value
  if (!el) return
  el.focus()
  el.setSelectionRange(el.value.length, el.value.length)
})

async function save() {
  const raw = toRawContent(text.value.trim(), users.mentionTargets)
  if (!raw && props.message.attachments.length === 0) {
    const ok = await ui.askConfirm({
      title: '메시지 삭제',
      message: '내용을 비우면 메시지가 삭제됩니다. 삭제할까요?',
      confirmLabel: '삭제',
      danger: true,
    })
    if (ok) await messages.remove(props.message.channelId, props.message.id)
    emit('done')
    return
  }
  if (raw === props.message.content) {
    emit('done')
    return
  }
  saving.value = true
  try {
    await messages.edit(props.message.channelId, props.message.id, raw)
    emit('done')
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void save()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('done')
  }
}
</script>

<template>
  <div class="editor">
    <textarea
      ref="textarea"
      v-model="text"
      class="editor-input"
      rows="1"
      maxlength="2000"
      :disabled="saving"
      aria-label="메시지 수정"
      @keydown="onKeydown"
    />
    <p class="hint">
      ESC 키로 <button type="button" class="link" @click="emit('done')">취소</button> • Enter 키로
      <button type="button" class="link" @click="save">저장</button>
    </p>
  </div>
</template>

<style scoped>
.editor {
  margin-top: 4px;
}

.editor-input {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-normal);
  resize: none;
  line-height: 1.375;
}

.hint {
  margin-top: 6px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.link {
  color: var(--link);
}

.link:hover {
  text-decoration: underline;
}
</style>
