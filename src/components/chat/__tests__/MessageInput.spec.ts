import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Channel } from '@/api'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore } from '@/stores/ui'
import { tooltip } from '@/directives/tooltip'
import MessageInput from '../MessageInput.vue'

const channel: Channel = {
  id: 'c1',
  type: 'text',
  name: 'general',
  topic: null,
  position: 0,
  createdBy: null,
  participants: [],
  lastMessageId: null,
  lastMessageAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('MessageInput', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useUiStore().setConnection('connected')
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }),
    })
  })

  const mountInput = () =>
    mount(MessageInput, {
      props: { channel, replyTo: null },
      global: { directives: { tooltip } },
      attachTo: document.body,
    })

  it('sends on Enter and clears the textarea', async () => {
    const messages = useMessagesStore()
    const send = vi.spyOn(messages, 'send').mockResolvedValue()
    const wrapper = mountInput()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('hello world')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(send).toHaveBeenCalledWith('c1', { content: 'hello world', attachments: [], replyTo: null })
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    wrapper.unmount()
  })

  it('does not send on Shift+Enter', async () => {
    const messages = useMessagesStore()
    const send = vi.spyOn(messages, 'send').mockResolvedValue()
    const wrapper = mountInput()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('line one')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(send).not.toHaveBeenCalled()
    expect((textarea.element as HTMLTextAreaElement).value).toBe('line one')
    wrapper.unmount()
  })

  it('does not send empty or whitespace-only messages', async () => {
    const messages = useMessagesStore()
    const send = vi.spyOn(messages, 'send').mockResolvedValue()
    const wrapper = mountInput()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('   ')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(send).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('asks to edit the last message on ArrowUp in an empty input', async () => {
    const wrapper = mountInput()
    await wrapper.find('textarea').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('editLast')).toHaveLength(1)
    wrapper.unmount()
  })
})
