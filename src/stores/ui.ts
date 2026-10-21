import { defineStore } from 'pinia'
import type { Component } from 'vue'
import type { Message } from '@/api'
import { readJson, writeJson } from '@/utils/storage'

export type MobileTab = 'channels' | 'chat' | 'members'
export type ConnectionState = 'connecting' | 'connected' | 'disconnected'
export type ToastKind = 'info' | 'success' | 'error'
export type SettingsTab = 'account' | 'profile' | 'voice' | 'notifications' | 'appearance' | 'admin'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

export interface MenuItem {
  id: string
  label: string
  icon?: Component
  danger?: boolean
  disabled?: boolean
  separator?: boolean
  action?: () => void
}

export interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  preview?: Message | null
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

export interface LightboxState {
  url: string
  filename: string
}

export interface ProfilePopoverState {
  userId: string
  x: number
  y: number
  /** 'left' = popover opens to the left of x (member list), 'right' = to the right (chat) */
  side: 'left' | 'right'
}

let toastCounter = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    memberListVisible: readJson<boolean>('ui.memberList', true),
    mobileTab: 'chat' as MobileTab,
    settingsOpen: false,
    settingsTab: 'account' as SettingsTab,
    createChannelType: null as 'text' | 'voice' | null,
    editChannelId: null as string | null,
    confirm: null as ConfirmState | null,
    lightbox: null as LightboxState | null,
    contextMenu: null as ContextMenuState | null,
    profilePopover: null as ProfilePopoverState | null,
    toasts: [] as Toast[],
    pinsOpen: false,
    searchOpen: false,
    searchQuery: '',
    /** channel currently displayed in the main pane */
    activeChannelId: null as string | null,
    /** the message list is scrolled to the bottom */
    atBottom: true,
    connection: 'connecting' as ConnectionState,
    /** message id to highlight briefly after a jump */
    highlightMessageId: null as string | null,
    /** id to scroll into view once loaded */
    jumpToMessageId: null as string | null,
  }),
  getters: {
    isViewing: (s) => (channelId: string) =>
      s.activeChannelId === channelId &&
      s.atBottom &&
      (typeof document === 'undefined' || document.visibilityState === 'visible'),
  },
  actions: {
    toggleMemberList() {
      this.memberListVisible = !this.memberListVisible
      writeJson('ui.memberList', this.memberListVisible)
    },
    setMobileTab(tab: MobileTab) {
      this.mobileTab = tab
    },
    openSettings(tab: SettingsTab = 'account') {
      this.settingsTab = tab
      this.settingsOpen = true
    },
    closeSettings() {
      this.settingsOpen = false
    },
    openCreateChannel(type: 'text' | 'voice') {
      this.createChannelType = type
    },
    openEditChannel(channelId: string) {
      this.editChannelId = channelId
    },
    openContextMenu(event: MouseEvent, items: MenuItem[]) {
      event.preventDefault()
      event.stopPropagation()
      this.profilePopover = null
      this.contextMenu = { x: event.clientX, y: event.clientY, items }
    },
    closeContextMenu() {
      this.contextMenu = null
    },
    openProfile(userId: string, anchor: { x: number; y: number }, side: 'left' | 'right' = 'right') {
      this.contextMenu = null
      this.profilePopover = { userId, x: anchor.x, y: anchor.y, side }
    },
    closeProfile() {
      this.profilePopover = null
    },
    openLightbox(url: string, filename: string) {
      this.lightbox = { url, filename }
    },
    closeLightbox() {
      this.lightbox = null
    },
    askConfirm(options: ConfirmOptions): Promise<boolean> {
      return new Promise((resolve) => {
        this.confirm = { ...options, resolve }
      })
    },
    resolveConfirm(ok: boolean) {
      this.confirm?.resolve(ok)
      this.confirm = null
    },
    toast(message: string, kind: ToastKind = 'info', timeout = 4000) {
      const id = ++toastCounter
      this.toasts.push({ id, kind, message })
      setTimeout(() => this.dismissToast(id), timeout)
      return id
    },
    dismissToast(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    setActiveChannel(channelId: string | null) {
      this.activeChannelId = channelId
      this.atBottom = true
      this.pinsOpen = false
    },
    setAtBottom(value: boolean) {
      this.atBottom = value
    },
    setConnection(state: ConnectionState) {
      this.connection = state
    },
    openSearch(query = '') {
      this.searchOpen = true
      if (query) this.searchQuery = query
    },
    closeSearch() {
      this.searchOpen = false
    },
    requestJump(messageId: string) {
      this.jumpToMessageId = messageId
      this.highlightMessageId = messageId
      setTimeout(() => {
        if (this.highlightMessageId === messageId) this.highlightMessageId = null
      }, 2500)
    },
    clearJump() {
      this.jumpToMessageId = null
    },
  },
})
