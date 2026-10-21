<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { errorMessage } from '@/api/client'
import { useSettingsStore, type VoiceSettings as VoiceSettingsModel } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useVoiceStore } from '@/stores/voice'
import { getMicrophoneStream, listAudioInputs, mediaSupported, stopStream, type AudioInputDevice } from '@/rtc/devices'
import { LocalMonitor } from '@/rtc/audio'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'

const settings = useSettingsStore()
const voice = useVoiceStore()
const ui = useUiStore()

const devices = ref<AudioInputDevice[]>([])
const testing = ref(false)
const level = ref(0)
let testStream: MediaStream | null = null
let monitor: LocalMonitor | null = null
let raf = 0

const supported = mediaSupported()

async function refreshDevices() {
  try {
    devices.value = await listAudioInputs()
  } catch {
    devices.value = []
  }
}

onMounted(() => {
  void refreshDevices()
  navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices)
})

onBeforeUnmount(() => {
  navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices)
  stopTest()
})

async function applyVoice(patch: Partial<VoiceSettingsModel>) {
  settings.update({ voice: patch })
  if (voice.isConnected && ('inputDeviceId' in patch || 'echoCancellation' in patch || 'noiseSuppression' in patch || 'autoGainControl' in patch)) {
    try {
      await voice.restartMicrophone()
    } catch (error) {
      ui.toast(errorMessage(error, '마이크를 다시 시작하지 못했습니다.'), 'error')
    }
  }
  if (testing.value) {
    stopTest()
    await startTest()
  }
}

const inputDevice = computed({
  get: () => settings.voice.inputDeviceId ?? '',
  set: (value: string) => void applyVoice({ inputDeviceId: value || null }),
})

const outputVolume = computed({
  get: () => Math.round(settings.voice.outputVolume * 100),
  set: (value: number) => {
    settings.update({ voice: { outputVolume: value / 100 } })
    voice.applyOutputVolume(value / 100)
  },
})

function toggle(key: 'echoCancellation' | 'noiseSuppression' | 'autoGainControl' | 'joinLeaveSounds') {
  return computed({
    get: () => settings.voice[key],
    set: (value: boolean) => void applyVoice({ [key]: value }),
  })
}

const echoCancellation = toggle('echoCancellation')
const noiseSuppression = toggle('noiseSuppression')
const autoGainControl = toggle('autoGainControl')
const joinLeaveSounds = toggle('joinLeaveSounds')

async function startTest() {
  try {
    testStream = await getMicrophoneStream(settings.voice)
    monitor = new LocalMonitor(testStream, () => undefined)
    testing.value = true
    await refreshDevices()
    const tick = () => {
      level.value = Math.min(1, (monitor?.level ?? 0) * 6)
      raf = requestAnimationFrame(tick)
    }
    tick()
  } catch (error) {
    ui.toast(errorMessage(error, '마이크에 접근할 수 없습니다. 브라우저 권한을 확인해 주세요.'), 'error')
  }
}

function stopTest() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  monitor?.close()
  monitor = null
  stopStream(testStream)
  testStream = null
  testing.value = false
  level.value = 0
}
</script>

<template>
  <section>
    <h2 class="title">음성 및 비디오</h2>
    <p v-if="!supported" class="warning">이 브라우저에서는 마이크를 사용할 수 없어요. HTTPS 주소인지 확인해 주세요.</p>

    <div class="grid">
      <label class="field">
        <span class="label">입력 장치</span>
        <select v-model="inputDevice" class="input">
          <option value="">기본 장치</option>
          <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">{{ device.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="label">출력 음량 — {{ outputVolume }}%</span>
        <input v-model.number="outputVolume" type="range" min="0" max="200" step="5" class="range" />
      </label>
    </div>

    <h3 class="subtitle">마이크 테스트</h3>
    <div class="test">
      <button type="button" class="btn" :class="testing ? 'btn-secondary' : 'btn-primary'" :disabled="!supported" @click="testing ? stopTest() : startTest()">
        {{ testing ? '중지' : '테스트 시작' }}
      </button>
      <div class="meter" aria-label="입력 레벨">
        <div class="meter-fill" :style="{ width: `${Math.round(level * 100)}%` }" />
      </div>
    </div>
    <p class="hint">테스트 중에는 내 소리가 재생되지 않고 입력 레벨만 표시돼요.</p>

    <h3 class="subtitle">음성 처리</h3>
    <ToggleSwitch v-model="echoCancellation" label="에코 제거" description="스피커 소리가 마이크로 다시 들어가는 것을 줄입니다." />
    <ToggleSwitch v-model="noiseSuppression" label="소음 억제" description="키보드, 선풍기 같은 배경 소음을 줄입니다." />
    <ToggleSwitch v-model="autoGainControl" label="자동 음량 조절" description="마이크 입력 크기를 자동으로 맞춥니다." />

    <h3 class="subtitle">소리</h3>
    <ToggleSwitch v-model="joinLeaveSounds" label="입장·퇴장 효과음" description="음성 채널에 들어오고 나갈 때 효과음을 재생합니다." />
  </section>
</template>

<style scoped>
.title {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--header-primary);
}

.subtitle {
  margin: 32px 0 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.warning {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(240, 178, 50, 0.15);
  color: var(--yellow);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.range {
  width: 100%;
  accent-color: var(--brand);
}

.test {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meter {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: var(--green);
  transition: width 60ms linear;
}

.hint {
  margin-top: 8px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

@media (max-width: 599px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
