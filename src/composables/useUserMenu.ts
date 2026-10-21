import { useRouter } from 'vue-router'
import { AtSign, MessageSquare, UserRound, Volume1, VolumeX } from '@lucide/vue'
import type { VoiceMember } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore, type MenuItem } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useVoiceStore } from '@/stores/voice'
import { mentionBus } from '@/composables/mentionBus'

interface UserMenuOptions {
  voiceMember?: VoiceMember
  anchor?: { x: number; y: number }
}

/** Context-menu items for a user (member list, message author, voice member). */
export function useUserMenu() {
  const auth = useAuthStore()
  const users = useUsersStore()
  const channels = useChannelsStore()
  const voice = useVoiceStore()
  const ui = useUiStore()
  const router = useRouter()

  async function openDm(userId: string) {
    try {
      const channel = await channels.openDm(userId)
      ui.setMobileTab('chat')
      await router.push(`/channels/@me/${channel.id}`)
    } catch (error) {
      ui.toast(errorMessage(error), 'error')
    }
  }

  function itemsFor(userId: string, options: UserMenuOptions = {}): MenuItem[] {
    const isMe = userId === auth.userId
    const user = users.get(userId)
    const items: MenuItem[] = [
      {
        id: 'profile',
        label: '프로필',
        icon: UserRound,
        action: () => {
          const anchor = options.anchor ?? { x: window.innerWidth / 2 - 150, y: 120 }
          ui.openProfile(userId, anchor, 'right')
        },
      },
    ]
    if (!isMe) {
      items.push({ id: 'dm', label: '메시지 보내기', icon: MessageSquare, action: () => void openDm(userId) })
      items.push({ id: 'mention', label: '멘션', icon: AtSign, action: () => mentionBus.emit(userId) })
    }
    if (options.voiceMember && !isMe && user) {
      const current = voice.volumeFor(userId)
      items.push({ id: 'sep', label: '', separator: true })
      items.push({
        id: 'volume',
        label: current === 0 ? '음소거 해제' : '이 사용자 음소거',
        icon: current === 0 ? Volume1 : VolumeX,
        action: () => voice.setVolume(userId, current === 0 ? 1 : 0),
      })
    }
    return items
  }

  return { itemsFor, openDm }
}
