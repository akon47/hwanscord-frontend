import { http } from './client'
import type { IceServersResponse, RtcUsage } from './types'

export function fetchIceServers() {
  return http.get<IceServersResponse>('/rtc/ice-servers')
}

export function fetchRtcUsage() {
  return http.get<RtcUsage>('/rtc/usage')
}
