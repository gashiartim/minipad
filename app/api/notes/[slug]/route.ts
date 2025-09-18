import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { updateNoteSchema, slugSchema } from "@/lib/validators"
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestSize,
  checkRateLimit,
  logRequest,
  logError,
} from "@/lib/api-middleware"
import { broadcastNoteUpdate } from "./events/route"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { slug } = await params
    const url = new URL(request.url)
    const providedSecret = url.searchParams.get("secret")

    // Validate slug
    const slugValidation = slugSchema.safeParse(slug)
    if (!slugValidation.success) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid slug format", "INVALID_SLUG", 400)
    }

    const note = await prisma.note.findUnique({
      where: { slug },
      include: {
        images: {
          select: {
            id: true,
            path: true,
            mime: true,
            width: true,
            height: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    })

    if (!note) {
      logRequest(request, 404, startTime)
      return createErrorResponse("Note not found", "NOT_FOUND", 404)
    }

    // If note is protected and no secret provided, return 401
    if (note.secret && note.secret !== providedSecret) {
      logRequest(request, 401, startTime)
      return createErrorResponse("Authentication required", "AUTH_REQUIRED", 401)
    }

    // Don't return the secret in the response
    const { secret, ...noteData } = note

    logRequest(request, 200, startTime)
    return createSuccessResponse(noteData)
  } catch (error) {
    logError(error, `GET /api/notes/${(await params).slug}`)
    logRequest(request, 500, startTime)
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { slug } = await params

    // Check rate limit first
    const rateLimitResult = checkRateLimit(request)
    if (!rateLimitResult.allowed) {
      logRequest(request, 429, startTime)
      return rateLimitResult.response!
    }

    if (!validateRequestSize(request)) {
      logRequest(request, 413, startTime)
      return createErrorResponse("Request too large", "REQUEST_TOO_LARGE", 413)
    }

    // Validate slug
    const slugValidation = slugSchema.safeParse(slug)
    if (!slugValidation.success) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid slug format", "INVALID_SLUG", 400)
    }

    const body = await request.json()
    const validation = updateNoteSchema.safeParse(body)

    if (!validation.success) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid request data", "VALIDATION_ERROR", 400)
    }

    const { content, contentRich, contentFormat, secret } = validation.data

    // Find the note
    const existingNote = await prisma.note.findUnique({
      where: { slug },
    })

    if (!existingNote) {
      logRequest(request, 404, startTime)
      return createErrorResponse("Note not found", "NOT_FOUND", 404)
    }

    // Check secret if note is protected
    if (existingNote.secret && existingNote.secret !== secret) {
      logRequest(request, 403, startTime)
      return createErrorResponse("Invalid or missing secret", "FORBIDDEN", 403)
    }

    const shouldUpdate = 
      (content !== undefined && content !== existingNote.content) ||
      (contentRich !== undefined && contentRich !== existingNote.contentRich) ||
      (contentFormat !== undefined && contentFormat !== existingNote.contentFormat)

    if (!shouldUpdate) {
      logRequest(request, 200, startTime)
      return createSuccessResponse({
        ok: true,
        updatedAt: existingNote.updatedAt,
      })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (content !== undefined) updateData.content = content
    if (contentRich !== undefined) updateData.contentRich = contentRich
    if (contentFormat !== undefined) updateData.contentFormat = contentFormat

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { slug },
      data: updateData,
    })

    // Broadcast update to connected clients
    broadcastNoteUpdate(slug, {
      type: "content_update",
      content: updatedNote.content,
      contentRich: updatedNote.contentRich,
      contentFormat: updatedNote.contentFormat,
      updatedAt: updatedNote.updatedAt.toISOString(),
    })

    logRequest(request, 200, startTime)
    return createSuccessResponse({
      ok: true,
      updatedAt: updatedNote.updatedAt,
    })
  } catch (error) {
    logError(error, `PUT /api/notes/${(await params).slug}`)
    logRequest(request, 500, startTime)
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500)
  }
}
