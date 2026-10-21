import { describe, expect, it } from 'vitest'
import {
  cooldownLeft,
  gateRedirect,
  usernameError,
  usernameFromEmail,
  emailError,
  isValidEmail,
  maskEmail,
  passwordError,
  repeatError,
} from './account'

describe('form validation', () => {
  it.each([
    ['me@kimhwan.kr', true],
    ['  Me@Example.COM ', true],
    ['a.b+tag@sub.example.co', true],
    ['no-at-sign', false],
    ['two@@example.com', false],
    ['space in@example.com', false],
    ['me@localhost', false],
    ['', false],
    [`${'a'.repeat(250)}@x.io`, false],
  ])('isValidEmail(%j) = %s', (value, ok) => {
    expect(isValidEmail(value)).toBe(ok)
  })

  it('explains what is wrong', () => {
    expect(emailError('')).toBe('이메일을 입력해 주세요.')
    expect(emailError('nope')).toBe('올바른 이메일 주소를 입력해 주세요.')
    expect(emailError('ok@example.com')).toBeNull()
    expect(passwordError('short')).toBe('8자 이상 입력해 주세요.')
    expect(passwordError('x'.repeat(73))).toBe('72자 이하로 입력해 주세요.')
    expect(passwordError('long-enough')).toBeNull()
    expect(repeatError('abcdefgh', '')).toBeNull()
    expect(repeatError('abcdefgh', 'abcdefgx')).toBe('비밀번호가 일치하지 않아요.')
    expect(repeatError('abcdefgh', 'abcdefgh')).toBeNull()
  })
})

describe('maskEmail', () => {
  it.each([
    ['hwan@kimhwan.kr', 'h**n@kimhwan.kr'],
    ['ab@x.io', 'a*@x.io'],
    ['a@x.io', 'a*@x.io'],
    ['averyverylongname@x.io', 'a******e@x.io'],
  ])('%s → %s', (email, masked) => {
    expect(maskEmail(email)).toBe(masked)
  })
})

describe('username suggestion', () => {
  it.each([
    ['mina.kim@example.com', 'mina.kim'],
    ['Hello.World+Tag@Example.com', 'hello.world_tag'],
    ['__x__@example.com', 'xuser'],
    ['김환@example.com', 'user'],
    [`${'a'.repeat(40)}@x.io`, 'a'.repeat(32)],
  ])('%s → %s', (email, handle) => {
    expect(usernameFromEmail(email)).toBe(handle)
    expect(usernameError(usernameFromEmail(email))).toBeNull()
  })

  it('explains invalid handles', () => {
    expect(usernameError('')).toBe('사용자명을 입력해 주세요.')
    expect(usernameError('Bad Name')).toContain('2~32자')
    expect(usernameError('ok_name.1')).toBeNull()
  })
})

describe('gateRedirect', () => {
  const app = { name: 'home', requiresAuth: true }
  const gate = { name: 'email-gate', requiresAuth: false }
  const login = { name: 'login', requiresAuth: false }

  it('sends gated users to the email gate from any app route', () => {
    expect(gateRedirect({ emailRequired: true }, app)).toBe('/verify-email')
    expect(gateRedirect({ emailRequired: true }, gate)).toBeNull()
    expect(gateRedirect({ emailRequired: true }, login)).toBeNull()
  })

  it('sends verified users out of the gate and leaves everything else alone', () => {
    expect(gateRedirect({ emailRequired: false }, gate)).toBe('/channels/@me')
    expect(gateRedirect({ emailRequired: false }, app)).toBeNull()
    expect(gateRedirect(null, app)).toBeNull()
  })
})

describe('cooldownLeft', () => {
  it('counts down from 60 seconds', () => {
    expect(cooldownLeft(null, 60, 1000)).toBe(0)
    expect(cooldownLeft(0, 60, 0)).toBe(60)
    expect(cooldownLeft(0, 60, 59_001)).toBe(1)
    expect(cooldownLeft(0, 60, 60_000)).toBe(0)
  })
})
