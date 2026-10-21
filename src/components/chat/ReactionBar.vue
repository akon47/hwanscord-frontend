<script setup lang="ts">
import { computed, ref } from 'vue'
import { SmilePlus } from '@lucide/vue'
import type { Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import EmojiPicker from './EmojiPicker.vue'

const props = defineProps<{ message: Message }>()

const auth = useAuthStore()
const users = useUsersStore()
const messages = useMessagesStore()
const ui = useUiStore()
const pickerOpen = ref(false)

const reactions = computed(() => props.message.reactions.filter((r) => r.count > 0))

function isMine(userIds: string[]) {
  return auth.userId ? userIds.includes(auth.userId) : false
}

function whoReacted(userIds: string[]): string {
  const names = userIds.slice(0, 5).map((id) => (id === auth.userId ? '나' : users.displayName(id)))
  const rest = userIds.length - names.length
  return rest > 0 ? `${names.join(', ')} 외 ${rest}명` : names.join(', ')
}

async function toggle(emoji: string) {
  try {
    await messages.toggleReaction(props.message, emoji)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function pick(emoji: string) {
  pickerOpen.value = false
  await toggle(emoji)
}
</script>

<template>
  <div v-if="reactions.length" class="reactions">
    <button
      v-for="reaction in reactions"
      :key="reaction.emoji"
      v-tooltip="whoReacted(reaction.userIds)"
      type="button"
      class="reaction"
      :class="{ 'is-mine': isMine(reaction.userIds) }"
      :aria-pressed="isMine(reaction.userIds)"
      :aria-label="`${reaction.emoji} ${reaction.count}`"
      @click="toggle(reaction.emoji)"
    >
      <span class="emoji">{{ reaction.emoji }}</span>
      <span class="count">{{ reaction.count }}</span>
    </button>
    <div class="add-wrap">
      <button
        v-tooltip="'반응 추가'"
        type="button"
        class="reaction add"
        aria-label="반응 추가"
        @click="pickerOpen = !pickerOpen"
      >
        <SmilePlus :size="16" />
      </button>
      <EmojiPicker v-if="pickerOpen" class="picker" @select="pick" @close="pickerOpen = false" />
    </div>
  </div>
</template>

<style scoped>
.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.reaction {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.reaction:hover {
  border-color: var(--text-faint);
  background: var(--bg-modifier-hover);
}

.reaction.is-mine {
  border-color: var(--brand);
  background: var(--mention-bg);
  color: var(--header-primary);
}

.emoji {
  font-size: 1rem;
  line-height: 1;
}

.add {
  padding: 0 6px;
}

.add-wrap {
  position: relative;
}

.picker {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  z-index: 50;
}
</style>
