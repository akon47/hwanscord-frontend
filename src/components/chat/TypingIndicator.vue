<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMessagesStore } from '@/stores/messages'
import { useUsersStore } from '@/stores/users'

const props = defineProps<{ channelId: string }>()

const messages = useMessagesStore()
const users = useUsersStore()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const names = computed(() => messages.typingUserIds(props.channelId, now.value).map((id) => users.displayName(id)))

const text = computed(() => {
  const list = names.value
  if (list.length === 0) return ''
  if (list.length === 1) return `${list[0]}님이 입력 중...`
  if (list.length === 2) return `${list[0]}님, ${list[1]}님이 입력 중...`
  if (list.length === 3) return `${list[0]}님, ${list[1]}님, ${list[2]}님이 입력 중...`
  return '여러 명이 입력 중...'
})
</script>

<template>
  <div class="typing" :class="{ 'is-visible': text }" aria-live="polite">
    <template v-if="text">
      <span class="dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="text">{{ text }}</span>
    </template>
  </div>
</template>

<style scoped>
.typing {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 16px;
  font-size: var(--font-size-sm);
  color: var(--text-normal);
}

.text {
  font-weight: 500;
}

.dots {
  display: inline-flex;
  gap: 3px;
}

.dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.2s infinite;
}

.dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
