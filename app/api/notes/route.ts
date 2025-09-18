import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { createNoteSchema, generateSlug } from "@/lib/validators"
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestSize,
  logRequest,
  logError,
} from "@/lib/api-middleware"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!validateRequestSize(request)) {
      logRequest(request, 413, startTime)
      return createErrorResponse("Request too large", "REQUEST_TOO_LARGE", 413)
    }

    const body = await request.json()
    const validation = createNoteSchema.safeParse(body)

    if (!validation.success) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid request data", "VALIDATION_ERROR", 400)
    }

    const { slug: providedSlug, content, secret } = validation.data
    const slug = providedSlug || generateSlug()

    // Check if slug already exists
    const existingNote = await prisma.note.findUnique({
      where: { slug },
    })

    if (existingNote) {
      logRequest(request, 409, startTime)
      return createErrorResponse("Slug already exists", "SLUG_EXISTS", 409)
    }

    // Create the note
    const note = await prisma.note.create({
      data: {
        slug,
        content: content || "",
        secret,
      },
    })

    logRequest(request, 200, startTime)
    return createSuccessResponse({ slug: note.slug })
  } catch (error) {
    logError(error, "POST /api/notes")
    logRequest(request, 500, startTime)
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500)
  }
}
