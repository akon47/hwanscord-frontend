import type { Directive, DirectiveBinding } from 'vue'

// v-tooltip="'text'" / v-tooltip.bottom="'text'" / v-tooltip.left / v-tooltip.right
type Placement = 'top' | 'bottom' | 'left' | 'right'

let tip: HTMLDivElement | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null
let activeEl: HTMLElement | null = null

function ensureTip(): HTMLDivElement {
  if (tip) return tip
  tip = document.createElement('div')
  tip.className = 'app-tooltip'
  tip.setAttribute('role', 'tooltip')
  document.body.appendChild(tip)
  return tip
}

function placementOf(binding: DirectiveBinding<string>): Placement {
  if (binding.modifiers.bottom) return 'bottom'
  if (binding.modifiers.left) return 'left'
  if (binding.modifiers.right) return 'right'
  return 'top'
}

function position(el: HTMLElement, placement: Placement): void {
  const t = ensureTip()
  const rect = el.getBoundingClientRect()
  const tr = t.getBoundingClientRect()
  const gap = 8
  let top = 0
  let left = 0
  switch (placement) {
    case 'bottom':
      top = rect.bottom + gap
      left = rect.left + rect.width / 2 - tr.width / 2
      break
    case 'left':
      top = rect.top + rect.height / 2 - tr.height / 2
      left = rect.left - tr.width - gap
      break
    case 'right':
      top = rect.top + rect.height / 2 - tr.height / 2
      left = rect.right + gap
      break
    default:
      top = rect.top - tr.height - gap
      left = rect.left + rect.width / 2 - tr.width / 2
  }
  left = Math.max(6, Math.min(left, window.innerWidth - tr.width - 6))
  top = Math.max(6, Math.min(top, window.innerHeight - tr.height - 6))
  t.style.top = `${top}px`
  t.style.left = `${left}px`
  t.dataset.placement = placement
}

function hide(): void {
  if (showTimer) clearTimeout(showTimer)
  showTimer = null
  activeEl = null
  if (tip) tip.classList.remove('is-visible')
}

interface TooltipEl extends HTMLElement {
  __tooltip?: { text: string; placement: Placement; show: () => void; hide: () => void }
}

export const tooltip: Directive<TooltipEl, string> = {
  mounted(el, binding) {
    const state = {
      text: binding.value ?? '',
      placement: placementOf(binding),
      show: () => {
        if (!state.text) return
        if (showTimer) clearTimeout(showTimer)
        showTimer = setTimeout(() => {
          const t = ensureTip()
          t.textContent = state.text
          activeEl = el
          t.classList.add('is-visible')
          position(el, state.placement)
        }, 120)
      },
      hide,
    }
    el.__tooltip = state
    el.addEventListener('mouseenter', state.show)
    el.addEventListener('mouseleave', state.hide)
    el.addEventListener('focus', state.show)
    el.addEventListener('blur', state.hide)
    el.addEventListener('pointerdown', state.hide)
    if (!el.getAttribute('aria-label') && state.text) el.setAttribute('aria-label', state.text)
  },
  updated(el, binding) {
    if (!el.__tooltip) return
    el.__tooltip.text = binding.value ?? ''
    el.__tooltip.placement = placementOf(binding)
    if (activeEl === el && tip) tip.textContent = el.__tooltip.text
  },
  beforeUnmount(el) {
    const state = el.__tooltip
    if (!state) return
    el.removeEventListener('mouseenter', state.show)
    el.removeEventListener('mouseleave', state.hide)
    el.removeEventListener('focus', state.show)
    el.removeEventListener('blur', state.hide)
    el.removeEventListener('pointerdown', state.hide)
    if (activeEl === el) hide()
    delete el.__tooltip
  },
}
