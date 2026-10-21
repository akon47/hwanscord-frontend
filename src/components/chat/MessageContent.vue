<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { renderMarkdown } from '@/utils/markdown'
import { isEmojiOnly } from '@/utils/emoji'

const props = withDefaults(defineProps<{ content: string; edited?: boolean; inline?: boolean }>(), {
  edited: false,
  inline: false,
})

const users = useUsersStore()
const auth = useAuthStore()
const ui = useUiStore()

const html = computed(() =>
  renderMarkdown(props.content, {
    resolveMention: (id) => users.get(id)?.displayName ?? null,
    selfId: auth.userId,
  }),
)

const jumbo = computed(() => !props.inline && isEmojiOnly(props.content))

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target) return
  const spoiler = target.closest<HTMLElement>('[data-spoiler]')
  if (spoiler) {
    spoiler.classList.toggle('is-revealed')
    event.preventDefault()
    return
  }
  const mention = target.closest<HTMLElement>('.md-mention[data-user-id]')
  if (mention?.dataset.userId) {
    const rect = mention.getBoundingClientRect()
    ui.openProfile(mention.dataset.userId, { x: rect.left, y: rect.bottom + 6 }, 'right')
  }
}
</script>

<template>
  <!-- html is produced by renderMarkdown, which escapes all user input first -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span class="md" :class="{ 'is-jumbo': jumbo }" @click="onClick" v-html="html" /><span v-if="edited" class="edited">(수정됨)</span>
</template>

<style scoped>
.edited {
  margin-left: 4px;
  font-size: 0.625rem;
  color: var(--text-faint);
  user-select: none;
}
</style>
