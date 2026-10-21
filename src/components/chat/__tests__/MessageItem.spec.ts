import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Message, User } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { tooltip } from '@/directives/tooltip'
import MessageItem from '../MessageItem.vue'

function user(id: string, displayName: string): User {
  return {
    id,
    username: displayName.toLowerCase(),
    displayName,
    avatarUrl: null,
    role: 'member',
    status: 'online',
    presence: 'online',
    customStatus: null,
    aboutMe: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    channelId: 'c1',
    author: { id: 'u2', username: 'bob', displayName: 'Bob', avatarUrl: null },
    content: 'hi <@u1>',
    attachments: [],
    replyTo: null,
    mentions: ['u1'],
    mentionEveryone: false,
    reactions: [{ emoji: '👍', count: 2, userIds: ['u1', 'u2'] }],
    pinned: false,
    editedAt: null,
    createdAt: '2026-10-21T06:00:00.000Z',
    ...overrides,
  }
}

describe('MessageItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const users = useUsersStore()
    users.upsert(user('u1', 'Alice'))
    users.upsert(user('u2', 'Bob'))
    const auth = useAuthStore()
    auth.user = user('u1', 'Alice')
    auth.token = 't'
  })

  const mountItem = (msg: Message, grouped = false) =>
    mount(MessageItem, {
      props: { message: msg, grouped },
      global: {
        directives: { tooltip },
        plugins: [createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { render: () => null } }] })],
      },
    })

  it('renders author, resolved mention chip and mention highlight', () => {
    const wrapper = mountItem(message())
    expect(wrapper.find('.author').text()).toBe('Bob')
    const chip = wrapper.find('.md-mention')
    expect(chip.text()).toBe('@Alice')
    expect(chip.classes()).toContain('is-self')
    expect(wrapper.find('article').classes()).toContain('is-mention')
  })

  it('renders reactions with counts and marks mine', () => {
    const wrapper = mountItem(message())
    const reaction = wrapper.find('.reaction')
    expect(reaction.text()).toContain('👍')
    expect(reaction.text()).toContain('2')
    expect(reaction.classes()).toContain('is-mine')
    expect(reaction.attributes('aria-pressed')).toBe('true')
  })

  it('hides the header for grouped messages and shows the edited marker', () => {
    const wrapper = mountItem(message({ editedAt: '2026-10-21T06:01:00.000Z' }), true)
    expect(wrapper.find('.author').exists()).toBe(false)
    expect(wrapper.find('.side-time').exists()).toBe(true)
    expect(wrapper.text()).toContain('(수정됨)')
  })

  it('never injects raw HTML from content', () => {
    const wrapper = mountItem(message({ content: '<img src=x onerror=alert(1)>', mentions: [] }))
    expect(wrapper.find('.md img').exists()).toBe(false)
    expect(wrapper.find('.md').text()).toContain('<img src=x onerror=alert(1)>')
  })
})
