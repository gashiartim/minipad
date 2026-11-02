import { slugSchema } from "@/lib/validators"
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_UPLOAD_REQUEST_BYTES, isAllowedImageMime } from "@/lib/image-rules"
import { apiError, createSuccessResponse, withApi } from "@/lib/api-middleware"
import { serviceErrorResponse } from "@/lib/api/service-error"
import { noteService } from "@/lib/notes/note-service"

type Params = { slug: string }

export const POST = withApi<Params>(
  async (request, { slug }) => {
    if (!slugSchema.safeParse(slug).success) return apiError("INVALID_SLUG")

    const formData = await request.formData()
    const file = formData.get("file")
    const secret = formData.get("secret")

    if (!(file instanceof File)) return apiError("NO_FILE")
    if (!isAllowedImageMime(file.type)) return apiError("INVALID_TYPE")
    if (file.size > MAX_IMAGE_SIZE_BYTES) return apiError("FILE_TOO_LARGE")

    const result = await noteService.uploadImage(slug, {
      buffer: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
      mime: file.type,
      sizeBytes: file.size,
      secret: typeof secret === "string" ? secret : null,
    })
    if (!result.ok) return serviceErrorResponse(result.error)

    return createSuccessResponse(result.value)
  },
  { rateLimit: true, maxBodyBytes: MAX_IMAGE_UPLOAD_REQUEST_BYTES }
)
