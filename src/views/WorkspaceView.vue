<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { startSession, stopSession } from '@/realtime/session'
import { writeJson } from '@/utils/storage'
import { errorMessage } from '@/api/client'
import ChannelSidebar from '@/components/layout/ChannelSidebar.vue'
import MemberList from '@/components/layout/MemberList.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import ConnectionBanner from '@/components/layout/ConnectionBanner.vue'
import ChatPane from '@/components/chat/ChatPane.vue'
import SearchPanel from '@/components/chat/SearchPanel.vue'
import VoiceChannelView from '@/components/voice/VoiceChannelView.vue'
import ChannelFormModal from '@/components/channels/ChannelFormModal.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import UserProfilePopover from '@/components/users/UserProfilePopover.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import HomeView from './HomeView.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const channels = useChannelsStore()
const readStates = useReadStatesStore()
const ui = useUiStore()

const loading = ref(true)
const loadError = ref<string | null>(null)
const isMobile = ref(false)
let media: MediaQueryList | null = null

const channelId = computed(() => (typeof route.params.channelId === 'string' ? route.params.channelId : null))
const channel = computed(() => (channelId.value ? channels.get(channelId.value) : undefined))

async function boot() {
  loading.value = true
  loadError.value = null
  try {
    await startSession(router)
  } catch (error) {
    loadError.value = errorMessage(error, '서버에 연결할 수 없습니다.')
  } finally {
    loading.value = false
  }
}

function onMedia() {
  isMobile.value = !!media?.matches
}

onMounted(() => {
  media = window.matchMedia('(max-width: 899px)')
  onMedia()
  media.addEventListener('change', onMedia)
  void boot()
})

onBeforeUnmount(() => {
  media?.removeEventListener('change', onMedia)
  if (!auth.isLoggedIn) stopSession()
})

// active channel bookkeeping + unknown channel → home
watch(
  [channelId, () => channels.loaded],
  ([id, loaded]) => {
    ui.setActiveChannel(id ?? null)
    if (id && loaded && !channels.get(id)) {
      ui.toast('채널을 찾을 수 없어요.', 'error')
      void router.replace('/channels/@me')
      return
    }
    if (id) writeJson('lastPath', route.fullPath)
  },
  { immediate: true },
)

// document title with mention count
watch(
  [() => readStates.totalMentions, channel],
  ([mentions, ch]) => {
    const name = ch ? (ch.type === 'dm' ? channels.displayName(ch) : `#${ch.name}`) : '홈'
    document.title = `${mentions > 0 ? `(${mentions}) ` : ''}${name} | HWANSCORD`
  },
  { immediate: true },
)

const showMembers = computed(() => !!channel.value && channel.value.type !== 'voice' && ui.memberListVisible && !ui.searchOpen)
const memberFilter = computed(() => (channel.value?.type === 'dm' ? channel.value.participants : undefined))
</script>

<template>
  <div class="workspace" :class="[`tab-${ui.mobileTab}`, { 'is-mobile': isMobile }]">
    <ConnectionBanner />
    <div v-if="loading" class="boot">
      <LoadingSpinner :size="40" />
      <p>HWANSCORD에 연결하는 중…</p>
    </div>
    <div v-else-if="loadError" class="boot">
      <p class="field-error">{{ loadError }}</p>
      <button type="button" class="btn btn-primary" @click="boot">다시 시도</button>
    </div>
    <div v-else class="columns">
      <ChannelSidebar class="col-sidebar" />
      <main class="col-main">
        <HomeView v-if="!channel" />
        <VoiceChannelView v-else-if="channel.type === 'voice'" :channel="channel" />
        <ChatPane v-else :key="channel.id" :channel="channel" />
      </main>
      <SearchPanel v-if="ui.searchOpen" class="col-members" />
      <MemberList v-else-if="showMembers || (isMobile && channel)" class="col-members" :only="memberFilter" />
    </div>
    <MobileNav v-if="isMobile && !loading" />

    <ChannelFormModal
      v-if="ui.createChannelType || ui.editChannelId"
      :create-type="ui.createChannelType"
      :channel-id="ui.editChannelId"
      @close="((ui.createChannelType = null), (ui.editChannelId = null))"
    />
    <SettingsModal v-if="ui.settingsOpen" />
    <UserProfilePopover />
  </div>
</template>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.boot {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

.columns {
  display: flex;
  flex: 1;
  min-height: 0;
}

.col-main {
  display: flex;
  flex: 1;
  min-width: 0;
}

/* mobile: one column at a time, chosen by the bottom tab bar */
.is-mobile .columns > * {
  display: none;
}

.is-mobile.tab-channels .col-sidebar,
.is-mobile.tab-chat .col-main,
.is-mobile.tab-members .col-members {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1;
}

.is-mobile.tab-members .col-members {
  display: block;
}
</style>
