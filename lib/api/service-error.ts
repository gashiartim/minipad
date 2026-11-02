import type { NoteErrorCode } from '@/lib/notes/note-service'
import { apiError } from '@/lib/api-middleware'

export function serviceErrorResponse(
  code: NoteErrorCode,
  notFoundMessage?: string
): Response {
  return apiError(code, code === 'NOT_FOUND' ? notFoundMessage : undefined)
}
