import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { authApi } from '@/api'
import RegisterView from '../RegisterView.vue'
import ForgotPasswordView from '../ForgotPasswordView.vue'
import ResetPasswordView from '../ResetPasswordView.vue'

function makeRouter(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/register', component: RegisterView },
      { path: '/forgot-password', component: ForgotPasswordView },
      { path: '/reset-password', component: ResetPasswordView },
      { path: '/channels/@me', component: { template: '<div />' } },
    ],
  })
  void router.push(path)
  return router
}

async function mountAt(component: object, path: string) {
  const router = makeRouter(path)
  await router.isReady()
  const wrapper = mount(component, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('register form', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(authApi, 'fetchProviders').mockResolvedValue({ github: false })
  })

  it('needs a valid email before it can be submitted', async () => {
    const { wrapper } = await mountAt(RegisterView, '/register')
    const inputs = wrapper.findAll('input')
    const [username, email, , password, repeat] = inputs
    await username!.setValue('hwan')
    await password!.setValue('long-password')
    await repeat!.setValue('long-password')
    const submit = wrapper.get('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await email!.setValue('not-an-email')
    expect(wrapper.text()).toContain('올바른 이메일 주소를 입력해 주세요.')
    expect(submit.attributes('disabled')).toBeDefined()

    await email!.setValue('hwan@kimhwan.kr')
    expect(wrapper.text()).not.toContain('올바른 이메일 주소를 입력해 주세요.')
    expect(submit.attributes('disabled')).toBeUndefined()
  })
})

describe('forgot password', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('always shows the same result, whether or not the account exists', async () => {
    const forgot = vi.spyOn(authApi, 'forgotPassword').mockResolvedValue()
    const { wrapper } = await mountAt(ForgotPasswordView, '/forgot-password')
    await wrapper.get('input').setValue('someone')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(forgot).toHaveBeenCalledWith('someone')
    expect(wrapper.text()).toContain('메일을 보냈어요(등록·인증된 이메일이 있다면)')
  })
})

describe('reset password', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('validates length and confirmation, then sends the token', async () => {
    const reset = vi.spyOn(authApi, 'resetPassword').mockResolvedValue()
    const { wrapper, router } = await mountAt(ResetPasswordView, '/reset-password?token=abc_DEF-123456789012345')
    await flushPromises()
    const [password, repeat] = wrapper.findAll('input')
    await password!.setValue('short')
    expect(wrapper.text()).toContain('8자 이상 입력해 주세요.')
    await password!.setValue('new-password-1')
    await repeat!.setValue('new-password-2')
    expect(wrapper.text()).toContain('비밀번호가 일치하지 않아요.')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await repeat!.setValue('new-password-1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(reset).toHaveBeenCalledWith('abc_DEF-123456789012345', 'new-password-1')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('explains an expired link', async () => {
    const { wrapper } = await mountAt(ResetPasswordView, '/reset-password')
    await flushPromises()
    expect(wrapper.text()).toContain('링크가 만료되었거나 이미 사용되었어요')
  })
})
