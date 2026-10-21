import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { authApi } from '@/api'
import { ApiError } from '@/api/client'
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

describe('register form (3 steps)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(authApi, 'fetchProviders').mockResolvedValue({ github: false })
  })

  it('email → code (auto-submit) → details with a suggested, checked username', async () => {
    const start = vi.spyOn(authApi, 'registerStart').mockResolvedValue()
    const verify = vi.spyOn(authApi, 'registerVerify').mockResolvedValue({ signupToken: 'signup.jwt.token' })
    const available = vi
      .spyOn(authApi, 'usernameAvailable')
      .mockImplementation(async (u: string) => ({ available: u !== 'taken', suggestion: u === 'taken' ? 'taken2' : u }))
    const register = vi.spyOn(authApi, 'register').mockResolvedValue({
      token: 't',
      user: { id: 'u', username: 'mina.kim', displayName: 'mina.kim' } as never,
    })
    const { wrapper, router } = await mountAt(RegisterView, '/register')

    // step 1: the button needs a valid email
    const submit = () => wrapper.get('button[type="submit"]')
    expect(submit().attributes('disabled')).toBeDefined()
    await wrapper.get('input[type="email"]').setValue('not-an-email')
    expect(wrapper.text()).toContain('올바른 이메일 주소를 입력해 주세요.')
    await wrapper.get('input[type="email"]').setValue('Mina.Kim@Example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(start).toHaveBeenCalledWith('mina.kim@example.com')

    // step 2: six boxes, a pasted code submits by itself
    const boxes = wrapper.findAll('input[inputmode="numeric"]')
    expect(boxes).toHaveLength(6)
    expect(wrapper.text()).toContain('재전송 (')
    for (const [i, d] of [...'123456'].entries()) await boxes[i]!.setValue(d)
    await flushPromises()
    expect(verify).toHaveBeenCalledWith('mina.kim@example.com', '123456')

    // step 3: suggested handle from the email, live availability
    vi.useFakeTimers()
    const handle = wrapper.get('input[autocomplete="username"]')
    expect((handle.element as HTMLInputElement).value).toBe('mina.kim')
    await handle.setValue('taken')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    expect(available).toHaveBeenCalledWith('taken')
    expect(wrapper.text()).toContain('이미 사용 중이에요.')
    await wrapper.get('button.link-btn').trigger('click') // "taken2 사용"
    await vi.advanceTimersByTimeAsync(400)
    vi.useRealTimers()
    await flushPromises()
    const [password, repeat] = wrapper.findAll('input[type="password"]')
    await password!.setValue('long-password')
    await repeat!.setValue('long-password')
    expect(submit().attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(register).toHaveBeenCalledWith({
      signupToken: 'signup.jwt.token',
      password: 'long-password',
      displayName: undefined,
      username: 'taken2',
    })
    expect(router.currentRoute.value.path).toBe('/channels/@me')
  })

  it('shows the attempts left for a wrong code', async () => {
    vi.spyOn(authApi, 'registerStart').mockResolvedValue()
    vi.spyOn(authApi, 'registerVerify').mockRejectedValue(
      new ApiError(400, 'BAD_REQUEST', '인증 코드가 올바르지 않습니다.', { remainingAttempts: 3 }),
    )
    const { wrapper } = await mountAt(RegisterView, '/register')
    await wrapper.get('input[type="email"]').setValue('a@b.co')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.findAll('input[inputmode="numeric"]')[0]!.setValue('000000')
    await flushPromises()
    expect(wrapper.text()).toContain('3번 더 시도할 수 있어요')
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
