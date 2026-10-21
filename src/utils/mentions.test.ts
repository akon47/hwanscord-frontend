import { describe, expect, it } from 'vitest'
import {
  activeEmojiQuery,
  activeMentionQuery,
  extractMentionIds,
  mentionsEveryone,
  mentionsUser,
  toEditableContent,
  toRawContent,
} from './mentions'

const users = [
  { id: 'a1', displayName: 'Kim', username: 'kim' },
  { id: 'b2', displayName: 'Kim Hwan', username: 'hwan' },
  { id: 'c3', displayName: '환', username: 'hwan2' },
]

describe('mentions', () => {
  it('extracts unique mention ids', () => {
    expect(extractMentionIds('<@a1> hi <@b2> <@a1>')).toEqual(['a1', 'b2'])
  })

  it('detects @everyone only as a word', () => {
    expect(mentionsEveryone('hey @everyone!')).toBe(true)
    expect(mentionsEveryone('mail@everyone.com')).toBe(false)
  })

  it('round-trips display names and raw tokens, preferring the longest name', () => {
    const raw = toRawContent('@Kim Hwan and @Kim and @환님', users)
    expect(raw).toBe('<@b2> and <@a1> and @환님')
    expect(toEditableContent('<@b2> and <@a1>', users)).toBe('@Kim Hwan and @Kim')
    expect(toRawContent('@hwan2 hi', users)).toBe('<@c3> hi')
  })

  it('keeps unknown tokens and email addresses untouched', () => {
    expect(toEditableContent('<@zz>', users)).toBe('<@zz>')
    expect(toRawContent('me@Kim.com', users)).toBe('me@Kim.com')
  })

  it('checks whether a user is mentioned', () => {
    expect(mentionsUser('x', ['a1'], false, 'a1')).toBe(true)
    expect(mentionsUser('x', [], true, 'a1')).toBe(true)
    expect(mentionsUser('<@a1>', [], false, 'a1')).toBe(true)
    expect(mentionsUser('x', ['b2'], false, 'a1')).toBe(false)
  })

  it('finds the mention query at the caret', () => {
    expect(activeMentionQuery('hello @ki', 9)).toEqual({ start: 6, query: 'ki' })
    expect(activeMentionQuery('hello @', 7)).toEqual({ start: 6, query: '' })
    expect(activeMentionQuery('mail@x', 6)).toBeNull()
    expect(activeMentionQuery('@kim done', 9)).toBeNull()
  })

  it('finds the emoji query with at least two chars', () => {
    expect(activeEmojiQuery('nice :th', 8)).toEqual({ start: 5, query: 'th' })
    expect(activeEmojiQuery('nice :t', 7)).toBeNull()
    expect(activeEmojiQuery('12:30', 5)).toBeNull()
  })
})
