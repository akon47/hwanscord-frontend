<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { stopSession } from '@/realtime/session'
import ContextMenu from '@/components/common/ContextMenu.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const auth = useAuthStore()
const settings = useSettingsStore()
const ui = useUiStore()
const router = useRouter()

settings.applyTheme()

onMounted(() => {
  // any 401 on an authenticated request → back to login
  auth.installUnauthorizedHandler(() => {
    stopSession()
    ui.toast('로그인이 만료되었어요. 다시 로그인해 주세요.', 'info')
    void router.replace('/login')
  })
})
</script>

<template>
  <RouterView />
  <ContextMenu />
  <ConfirmDialog />
  <ImageLightbox />
  <ToastContainer />
</template>
