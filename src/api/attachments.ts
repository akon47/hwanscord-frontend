import { upload } from './client'
import type { Attachment } from './types'

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_MESSAGE = 10

export function uploadAttachment(file: File, onProgress?: (ratio: number) => void) {
  const form = new FormData()
  form.append('file', file, file.name)
  return upload<{ attachment: Attachment }>('POST', '/attachments', form, onProgress)
}
