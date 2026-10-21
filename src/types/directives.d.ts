import type { tooltip } from '@/directives/tooltip'

declare module 'vue' {
  interface ComponentCustomProperties {
    vTooltip: typeof tooltip
  }
}

export {}
