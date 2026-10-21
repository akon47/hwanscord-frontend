<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { EMOJI_CATEGORIES, QUICK_REACTIONS, searchEmoji, type EmojiEntry } from '@/utils/emoji'
import { readJson, writeJson } from '@/utils/storage'

const emit = defineEmits<{ select: [emoji: string]; close: [] }>()

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const recents = ref(readJson<string[]>('emoji.recent', []))
const activeCategory = ref(EMOJI_CATEGORIES[0]!.id)

useClickOutside(root, () => emit('close'))
useEscapeKey(() => emit('close'))

onMounted(() => input.value?.focus())

const results = computed<EmojiEntry[] | null>(() => (query.value.trim() ? searchEmoji(query.value, 80) : null))

function choose(emoji: string) {
  recents.value = [emoji, ...recents.value.filter((e) => e !== emoji)].slice(0, 24)
  writeJson('emoji.recent', recents.value)
  emit('select', emoji)
}

function scrollTo(categoryId: string) {
  activeCategory.value = categoryId
  root.value?.querySelector<HTMLElement>(`[data-category="${categoryId}"]`)?.scrollIntoView({ block: 'start' })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && results.value?.[0]) {
    event.preventDefault()
    choose(results.value[0].char)
  }
}
</script>

<template>
  <div ref="root" class="emoji-picker" role="dialog" aria-label="이모지 선택">
    <div class="search">
      <input
        ref="input"
        v-model="query"
        type="text"
        class="search-input"
        placeholder="이모지 검색"
        aria-label="이모지 검색"
        @keydown="onKeydown"
      />
    </div>
    <nav v-if="!results" class="categories" aria-label="이모지 분류">
      <button
        v-for="category in EMOJI_CATEGORIES"
        :key="category.id"
        v-tooltip="category.label"
        type="button"
        class="category"
        :class="{ 'is-active': activeCategory === category.id }"
        @click="scrollTo(category.id)"
      >
        {{ category.emojis[0]?.char }}
      </button>
    </nav>
    <div class="grid-scroll scroller-thin">
      <template v-if="results">
        <p v-if="results.length === 0" class="empty">검색 결과가 없어요</p>
        <div class="grid">
          <button
            v-for="emoji in results"
            :key="emoji.char"
            v-tooltip="`:${emoji.name}:`"
            type="button"
            class="emoji"
            @click="choose(emoji.char)"
          >
            {{ emoji.char }}
          </button>
        </div>
      </template>
      <template v-else>
        <section v-if="recents.length" data-category="recent">
          <h4 class="section-title">자주 사용</h4>
          <div class="grid">
            <button v-for="emoji in recents" :key="emoji" type="button" class="emoji" @click="choose(emoji)">
              {{ emoji }}
            </button>
          </div>
        </section>
        <section v-else data-category="quick">
          <h4 class="section-title">빠른 반응</h4>
          <div class="grid">
            <button v-for="emoji in QUICK_REACTIONS" :key="emoji" type="button" class="emoji" @click="choose(emoji)">
              {{ emoji }}
            </button>
          </div>
        </section>
        <section v-for="category in EMOJI_CATEGORIES" :key="category.id" :data-category="category.id">
          <h4 class="section-title">{{ category.label }}</h4>
          <div class="grid">
            <button
              v-for="emoji in category.emojis"
              :key="emoji.char"
              v-tooltip="`:${emoji.name}:`"
              type="button"
              class="emoji"
              @click="choose(emoji.char)"
            >
              {{ emoji.char }}
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  display: flex;
  flex-direction: column;
  width: 340px;
  max-width: calc(100vw - 24px);
  height: 380px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-high);
  overflow: hidden;
  animation: pop-in var(--transition-fast);
}

.search {
  padding: 12px 12px 8px;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-normal);
  font-size: var(--font-size-sm);
}

.categories {
  display: flex;
  gap: 2px;
  padding: 0 8px 6px;
  border-bottom: 1px solid var(--divider-strong);
}

.category {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  opacity: 0.6;
}

.category:hover,
.category.is-active {
  background: var(--bg-modifier-hover);
  opacity: 1;
}

.grid-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 12px;
}

.section-title {
  padding: 8px 2px 4px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  font-size: 1.5rem;
  line-height: 1;
  transition: background-color var(--transition-fast);
}

.emoji:hover {
  background: var(--bg-modifier-selected);
}

.empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
