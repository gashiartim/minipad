import { slugSchema, updateNoteSchema } from "@/lib/validators"
import { apiError, createSuccessResponse, withApi, DEFAULT_MAX_BODY_BYTES } from "@/lib/api-middleware"
import { serviceErrorResponse } from "@/lib/api/service-error"
import { noteService } from "@/lib/notes/note-service"

type Params = { slug: string }

export const GET = withApi<Params>(async (request, { slug }) => {
  if (!slugSchema.safeParse(slug).success) return apiError("INVALID_SLUG")

  const secret = request.nextUrl.searchParams.get("secret")
  const result = await noteService.getNote(slug, secret)
  if (!result.ok) return serviceErrorResponse(result.error)

  return createSuccessResponse(result.value)
})

export const PUT = withApi<Params>(
  async (request, { slug }) => {
    if (!slugSchema.safeParse(slug).success) return apiError("INVALID_SLUG")

    const validation = updateNoteSchema.safeParse(await request.json())
    if (!validation.success) return apiError("VALIDATION_ERROR")

    const result = await noteService.updateNote(slug, validation.data)
    if (!result.ok) return serviceErrorResponse(result.error)

    return createSuccessResponse(result.value)
  },
  { rateLimit: true, maxBodyBytes: DEFAULT_MAX_BODY_BYTES }
)
