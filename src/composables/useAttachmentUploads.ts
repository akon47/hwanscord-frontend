import { computed, onBeforeUnmount, ref } from 'vue'
import { attachmentsApi, type Attachment } from '@/api'
import { errorMessage } from '@/api/client'
import { MAX_ATTACHMENTS_PER_MESSAGE, MAX_ATTACHMENT_BYTES } from '@/api/attachments'
import type { UploadHandle } from '@/api/client'
import { isImageType } from '@/utils/format'

export interface PendingAttachment {
  localId: string
  file: File
  previewUrl: string | null
  progress: number
  attachment: Attachment | null
  error: string | null
}

let counter = 0

/** Upload queue for the message composer: previews, progress and the resulting Attachment ids. */
export function useAttachmentUploads(onError: (message: string) => void) {
  const items = ref<PendingAttachment[]>([])
  const handles = new Map<string, UploadHandle<{ attachment: Attachment }>>()

  const uploading = computed(() => items.value.some((i) => !i.attachment && !i.error))
  const ready = computed(() => items.value.filter((i) => i.attachment).map((i) => i.attachment!))
  const hasFailures = computed(() => items.value.some((i) => i.error))

  function add(files: Iterable<File>) {
    for (const file of files) {
      if (items.value.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        onError(`첨부 파일은 한 번에 최대 ${MAX_ATTACHMENTS_PER_MESSAGE}개까지 보낼 수 있어요.`)
        return
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        onError(`'${file.name}'은(는) 25 MB를 넘어 보낼 수 없어요.`)
        continue
      }
      const localId = `att-${++counter}`
      const entry: PendingAttachment = {
        localId,
        file,
        previewUrl: isImageType(file.type) ? URL.createObjectURL(file) : null,
        progress: 0,
        attachment: null,
        error: null,
      }
      items.value.push(entry)
      const handle = attachmentsApi.uploadAttachment(file, (ratio) => {
        const current = items.value.find((i) => i.localId === localId)
        if (current) current.progress = ratio
      })
      handles.set(localId, handle)
      handle.promise
        .then(({ attachment }) => {
          const current = items.value.find((i) => i.localId === localId)
          if (current) {
            current.attachment = attachment
            current.progress = 1
          }
        })
        .catch((error: unknown) => {
          const current = items.value.find((i) => i.localId === localId)
          if (current && (error as { code?: string }).code !== 'ABORTED') current.error = errorMessage(error)
        })
        .finally(() => handles.delete(localId))
    }
  }

  function remove(localId: string) {
    handles.get(localId)?.abort()
    handles.delete(localId)
    const entry = items.value.find((i) => i.localId === localId)
    if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    items.value = items.value.filter((i) => i.localId !== localId)
  }

  function clear() {
    for (const entry of items.value) {
      handles.get(entry.localId)?.abort()
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    }
    handles.clear()
    items.value = []
  }

  onBeforeUnmount(clear)

  return { items, uploading, ready, hasFailures, add, remove, clear }
}
