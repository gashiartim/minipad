import { createNoteSchema } from "@/lib/validators"
import { apiError, createSuccessResponse, withApi, DEFAULT_MAX_BODY_BYTES } from "@/lib/api-middleware"
import { serviceErrorResponse } from "@/lib/api/service-error"
import { noteService } from "@/lib/notes/note-service"

export const POST = withApi(
  async (request) => {
    const validation = createNoteSchema.safeParse(await request.json())
    if (!validation.success) return apiError("VALIDATION_ERROR")

    const result = await noteService.createNote(validation.data)
    if (!result.ok) return serviceErrorResponse(result.error)

    return createSuccessResponse(result.value)
  },
  { rateLimit: true, maxBodyBytes: DEFAULT_MAX_BODY_BYTES }
)
