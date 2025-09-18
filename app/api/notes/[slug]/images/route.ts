import type { NextRequest } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/db"
import { slugSchema, allowedImageTypes, maxImageSize } from "@/lib/validators"
import { createErrorResponse, createSuccessResponse, checkRateLimit, logRequest, logError } from "@/lib/api-middleware"
import { ensureUploadsDir, generateImageFilename } from "@/lib/server-utils"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { slug } = await params

    // Check rate limit first
    const rateLimitResult = checkRateLimit(request)
    if (!rateLimitResult.allowed) {
      logRequest(request, 429, startTime)
      return rateLimitResult.response!
    }

    // Validate slug
    const slugValidation = slugSchema.safeParse(slug)
    if (!slugValidation.success) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid slug format", "INVALID_SLUG", 400)
    }

    // Find the note
    const note = await prisma.note.findUnique({
      where: { slug },
      include: {
        images: true,
      },
    })

    if (!note) {
      logRequest(request, 404, startTime)
      return createErrorResponse("Note not found", "NOT_FOUND", 404)
    }

    if (note.images.length >= 100) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Maximum images per note exceeded", "TOO_MANY_IMAGES", 400)
    }

    // Parse form data with size limit
    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > 12 * 1024 * 1024) {
      logRequest(request, 413, startTime)
      return createErrorResponse("Request too large", "REQUEST_TOO_LARGE", 413)
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const secret = formData.get("secret") as string | null

    if (!file) {
      logRequest(request, 400, startTime)
      return createErrorResponse("No file provided", "NO_FILE", 400)
    }

    // Check secret if note is protected
    if (note.secret && note.secret !== secret) {
      logRequest(request, 403, startTime)
      return createErrorResponse("Invalid or missing secret", "FORBIDDEN", 403)
    }

    // Validate file type
    if (!allowedImageTypes.includes(file.type as any)) {
      logRequest(request, 415, startTime)
      return createErrorResponse("Invalid file type", "INVALID_TYPE", 415)
    }

    // Validate file size
    if (file.size > maxImageSize) {
      logRequest(request, 413, startTime)
      return createErrorResponse("File too large", "FILE_TOO_LARGE", 413)
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate filename
    const filename = generateImageFilename(buffer, file.name)

    // Ensure uploads directory exists
    const uploadsDir = await ensureUploadsDir()
    const filePath = path.join(uploadsDir, filename)

    // Write file to disk
    await writeFile(filePath, buffer)

    // Create image record in database
    const image = await prisma.image.create({
      data: {
        noteId: note.id,
        path: filename,
        mime: file.type,
        sizeBytes: file.size,
        // width and height will be null for now (could add sharp later)
      },
    })

    logRequest(request, 200, startTime)
    return createSuccessResponse({
      id: image.id,
      path: image.path,
      mime: image.mime,
      width: image.width,
      height: image.height,
      sizeBytes: image.sizeBytes,
      createdAt: image.createdAt,
    })
  } catch (error) {
    logError(error, `POST /api/notes/${(await params).slug}/images`)
    logRequest(request, 500, startTime)
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500)
  }
}
