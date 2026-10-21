<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Hash, X } from '@lucide/vue'
import { messagesApi, type Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import MessageItem from './MessageItem.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const ui = useUiStore()
const channels = useChannelsStore()
const router = useRouter()

const results = ref<Message[]>([])
const total = ref(0)
const loading = ref(false)
const scope = ref<'channel' | 'all'>('channel')
const PAGE = 25

const channelFilter = computed(() => (scope.value === 'channel' ? ui.activeChannelId ?? undefined : undefined))

async function run(offset = 0) {
  const q = ui.searchQuery.trim()
  if (!q) return
  loading.value = true
  try {
    const res = await messagesApi.searchMessages({ q, channelId: channelFilter.value, limit: PAGE, offset })
    results.value = offset === 0 ? res.results : [...results.value, ...res.results]
    total.value = res.total
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

watch([() => ui.searchQuery, scope], () => void run(0), { immediate: true })

function channelName(message: Message): string {
  const channel = channels.get(message.channelId)
  return channel ? channels.displayName(channel) : '알 수 없는 채널'
}

async function open(message: Message) {
  const channel = channels.get(message.channelId)
  const path = channel?.type === 'dm' ? `/channels/@me/${message.channelId}` : `/channels/${message.channelId}`
  ui.requestJump(message.id)
  ui.setMobileTab('chat')
  await router.push(path)
}
</script>

<template>
  <aside class="search-panel" aria-label="검색 결과">
    <header class="panel-header">
      <div class="panel-title">
        <strong>검색 결과</strong>
        <span class="count">{{ total }}개</span>
      </div>
      <button type="button" class="icon-btn" aria-label="검색 닫기" @click="ui.closeSearch()">
        <X :size="20" />
      </button>
    </header>
    <div class="scope">
      <button type="button" class="scope-btn" :class="{ 'is-active': scope === 'channel' }" @click="scope = 'channel'">
        이 채널
      </button>
      <button type="button" class="scope-btn" :class="{ 'is-active': scope === 'all' }" @click="scope = 'all'">전체</button>
    </div>
    <div class="results scroller-thin">
      <LoadingSpinner v-if="loading && results.length === 0" :size="24" />
      <p v-else-if="results.length === 0" class="empty">
        "{{ ui.searchQuery }}"에 대한 결과가 없어요.
      </p>
      <article v-for="message in results" :key="message.id" class="result">
        <button type="button" class="result-channel" @click="open(message)">
          <Hash :size="14" /> {{ channelName(message) }}
        </button>
        <div class="result-body" @click="open(message)">
          <MessageItem :message="message" :grouped="false" readonly />
        </div>
      </article>
      <button v-if="results.length < total" type="button" class="btn btn-secondary more" :disabled="loading" @click="run(results.length)">
        더 보기
      </button>
    </div>
  </aside>
</template>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  width: min(420px, 100%);
  min-width: var(--members-w);
  height: 100%;
  background: var(--bg-secondary);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 8px 0 16px;
  box-shadow: var(--shadow-low);
}

.panel-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--header-primary);
}

.count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.scope {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
}

.scope-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.scope-btn.is-active {
  background: var(--bg-modifier-selected);
  color: var(--header-primary);
}

.results {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 16px;
}

.empty {
  padding: 32px 8px;
  text-align: center;
  color: var(--text-muted);
}

.result {
  margin-top: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--divider-strong);
  overflow: hidden;
}

.result-channel {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 6px 12px;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-align: left;
}

.result-channel:hover {
  color: var(--interactive-hover);
}

.result-body {
  padding-bottom: 6px;
  cursor: pointer;
}

.result-body :deep(.message) {
  margin-top: 4px;
}

.result-body:hover {
  background: var(--bg-modifier-hover);
}

.more {
  width: 100%;
  margin-top: 12px;
}
</style>
