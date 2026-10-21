import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeInput from '../CodeInput.vue'

function mountCode() {
  return mount(CodeInput, { props: { modelValue: '' }, attachTo: document.body })
}

function paste(el: HTMLInputElement, text: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
  event.clipboardData = { getData: () => text }
  el.dispatchEvent(event)
}

describe('CodeInput', () => {
  it('renders six numeric boxes', () => {
    const wrapper = mountCode()
    const boxes = wrapper.findAll('input')
    expect(boxes).toHaveLength(6)
    expect(boxes[0]!.attributes('inputmode')).toBe('numeric')
    expect(boxes[0]!.attributes('autocomplete')).toBe('one-time-code')
  })

  it('moves to the next box while typing and auto-submits the sixth digit', async () => {
    const wrapper = mountCode()
    const boxes = wrapper.findAll('input')
    for (const [i, d] of ['1', '2', '3', '4', '5'].entries()) await boxes[i]!.setValue(d)
    expect(wrapper.emitted('complete')).toBeUndefined()
    expect(document.activeElement).toBe(boxes[5]!.element)
    await boxes[5]!.setValue('6')
    expect(wrapper.emitted('complete')).toEqual([['123456']])
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['123456'])
  })

  it('spreads a pasted code over all boxes (wherever it is pasted) and submits it', async () => {
    const wrapper = mountCode()
    const boxes = wrapper.findAll('input')
    paste(boxes[3]!.element as HTMLInputElement, ' 987-654 ')
    await wrapper.vm.$nextTick()
    expect(boxes.map((b) => (b.element as HTMLInputElement).value).join('')).toBe('987654')
    expect(wrapper.emitted('complete')).toEqual([['987654']])
  })

  it('ignores letters and jumps back on Backspace in an empty box', async () => {
    const wrapper = mountCode()
    const boxes = wrapper.findAll('input')
    await boxes[0]!.setValue('a')
    expect((boxes[0]!.element as HTMLInputElement).value).toBe('')
    await boxes[0]!.setValue('4')
    await boxes[1]!.trigger('keydown', { key: 'Backspace' })
    expect(document.activeElement).toBe(boxes[0]!.element)
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
  })

  it('accepts a whole code typed into one box (one-time-code autofill)', async () => {
    const wrapper = mountCode()
    await wrapper.findAll('input')[0]!.setValue('135790')
    expect(wrapper.emitted('complete')).toEqual([['135790']])
  })
})
