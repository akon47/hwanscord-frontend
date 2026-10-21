import { describe, expect, it } from 'vitest'
import {
  cooldownLeft,
  emailBannerState,
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

describe('emailBannerState', () => {
  it('asks for an email, then for verification, then nothing', () => {
    expect(emailBannerState(null, false)).toBe('none')
    expect(emailBannerState({ email: null, emailVerified: false }, false)).toBe('missing')
    expect(emailBannerState({ email: 'a@b.co', emailVerified: false }, false)).toBe('unverified')
    expect(emailBannerState({ email: 'a@b.co', emailVerified: true }, false)).toBe('none')
  })

  it('stays hidden once dismissed for the session', () => {
    expect(emailBannerState({ email: null, emailVerified: false }, true)).toBe('none')
    expect(emailBannerState({ email: 'a@b.co', emailVerified: false }, true)).toBe('none')
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
