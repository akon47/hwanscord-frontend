import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { User } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import EmailBanner from '../EmailBanner.vue'

const base: User = {
  id: 'u1',
  username: 'hwan',
  displayName: '환',
  avatarUrl: null,
  role: 'member',
  status: 'online',
  presence: 'online',
  customStatus: null,
  aboutMe: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function mountAs(user: Partial<User>) {
  const auth = useAuthStore()
  auth.user = { ...base, ...user }
  auth.token = 't'
  return mount(EmailBanner)
}

describe('EmailBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('asks a user without email to register one, opening the account settings', async () => {
    const wrapper = mountAs({ email: null, emailVerified: false })
    expect(wrapper.text()).toContain('이메일을 등록하면 비밀번호를 잊어도 복구할 수 있어요')
    await wrapper.get('button.action').trigger('click')
    const ui = useUiStore()
    expect(ui.settingsOpen).toBe(true)
    expect(ui.settingsTab).toBe('account')
  })

  it('offers to resend for an unverified email and then counts down', async () => {
    const auth = useAuthStore()
    const wrapper = mountAs({ email: 'a@b.co', emailVerified: false })
    const resend = vi.spyOn(auth, 'resendVerification').mockResolvedValue()
    expect(wrapper.text()).toContain('인증 메일을 확인해 주세요')
    await wrapper.get('button.action').trigger('click')
    await flushPromises()
    expect(resend).toHaveBeenCalledOnce()
    const button = wrapper.get('button.action')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toMatch(/다시 보내기 \(\d+초\)/)
  })

  it('shows nothing for a verified email', () => {
    const wrapper = mountAs({ email: 'a@b.co', emailVerified: true })
    expect(wrapper.find('.banner').exists()).toBe(false)
  })

  it('stays dismissed for the rest of the session', async () => {
    const wrapper = mountAs({ email: null, emailVerified: false })
    await wrapper.get('button.close').trigger('click')
    expect(wrapper.find('.banner').exists()).toBe(false)
    expect(sessionStorage.getItem('hwanscord.emailBannerDismissed')).toBe('1')
    const again = mount(EmailBanner)
    expect(again.find('.banner').exists()).toBe(false)
  })
})
