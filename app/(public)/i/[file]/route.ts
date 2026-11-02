import { isValidImageFilename } from "@/lib/image-rules"
import { apiError, withApi } from "@/lib/api-middleware"
import { serviceErrorResponse } from "@/lib/api/service-error"
import { noteService } from "@/lib/notes/note-service"

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
}

export const GET = withApi<{ file: string }>(async (request, { file }) => {
  if (!isValidImageFilename(file)) return apiError("INVALID_FILENAME")

  const result = await noteService.getImageFile(file)
  if (!result.ok) return serviceErrorResponse(result.error, "File not found")

  const { mime, file: stored, etag } = result.value
  const headers = {
    ...CACHE_HEADERS,
    ETag: etag,
    "Last-Modified": stored.modifiedAt.toUTCString(),
  }

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(new Uint8Array(stored.buffer), {
    headers: { ...headers, "Content-Type": mime },
  })
})
