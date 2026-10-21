import { useRouter } from 'vue-router'
import { BellOff, Copy, Pencil, Trash2 } from '@lucide/vue'
import type { Channel } from '@/api'
import { errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore, type MenuItem } from '@/stores/ui'

/** Context-menu items for a text / voice channel row. */
export function useChannelMenu() {
  const channels = useChannelsStore()
  const readStates = useReadStatesStore()
  const messages = useMessagesStore()
  const ui = useUiStore()
  const router = useRouter()

  async function remove(channel: Channel) {
    const ok = await ui.askConfirm({
      title: `'${channel.name}' 채널 삭제`,
      message: `정말 '${channel.name}' 채널을 삭제할까요? 이 작업은 취소할 수 없습니다.`,
      confirmLabel: '채널 삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await channels.destroy(channel.id)
      if (ui.activeChannelId === channel.id) await router.replace('/channels/@me')
    } catch (error) {
      ui.toast(errorMessage(error), 'error')
    }
  }

  function markRead(channel: Channel) {
    const last = messages.lastMessage(channel.id)?.id ?? channel.lastMessageId
    if (last) readStates.ack(channel.id, last)
  }

  function copyLink(channel: Channel) {
    const base = channel.type === 'dm' ? '/channels/@me/' : '/channels/'
    void navigator.clipboard?.writeText(`${window.location.origin}${base}${channel.id}`)
    ui.toast('링크를 복사했습니다.', 'success', 2000)
  }

  function itemsFor(channel: Channel): MenuItem[] {
    const items: MenuItem[] = []
    if (channel.type !== 'voice') {
      items.push({
        id: 'read',
        label: '읽음으로 표시',
        icon: BellOff,
        disabled: !readStates.isUnread(channel.id),
        action: () => markRead(channel),
      })
    }
    items.push({ id: 'copy', label: '링크 복사', icon: Copy, action: () => copyLink(channel) })
    if (channels.canManage(channel)) {
      items.push({ id: 'sep', label: '', separator: true })
      items.push({ id: 'edit', label: '채널 편집', icon: Pencil, action: () => ui.openEditChannel(channel.id) })
      items.push({ id: 'delete', label: '채널 삭제', icon: Trash2, danger: true, action: () => void remove(channel) })
    }
    return items
  }

  return { itemsFor, remove, markRead, copyLink }
}
