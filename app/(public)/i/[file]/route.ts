import type { NextRequest } from "next/server"
import { readFile, stat } from "fs/promises"
import path from "path"
import { existsSync } from "fs"
import { prisma } from "@/lib/db"
import { createErrorResponse, logRequest, logError } from "@/lib/api-middleware"

interface RouteParams {
  params: Promise<{ file: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { file } = await params

    // Prevent path traversal attacks
    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid filename", "INVALID_FILENAME", 400)
    }

    // Validate filename format (should match our generated format)
    const filenameRegex = /^[a-f0-9]{16}-[a-z0-9]{4}\.(png|jpg|jpeg|webp|gif)$/i
    if (!filenameRegex.test(file)) {
      logRequest(request, 400, startTime)
      return createErrorResponse("Invalid filename format", "INVALID_FILENAME", 400)
    }

    const image = await prisma.image.findFirst({
      where: { path: file },
    })

    if (!image) {
      logRequest(request, 404, startTime)
      return createErrorResponse("File not found", "NOT_FOUND", 404)
    }

    const filePath = path.join(process.cwd(), "data", "uploads", file)

    // Check if file exists on disk
    if (!existsSync(filePath)) {
      logError(`File missing on disk: ${file}`, "GET /i/[file]")
      logRequest(request, 404, startTime)
      return createErrorResponse("File not found", "NOT_FOUND", 404)
    }

    const stats = await stat(filePath)
    const etag = `"${image.id}-${stats.mtime.getTime()}"`
    const lastModified = stats.mtime.toUTCString()

    const ifNoneMatch = request.headers.get("if-none-match")
    if (ifNoneMatch === etag) {
      logRequest(request, 304, startTime)
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Last-Modified": lastModified,
          "Cache-Control": "private, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    // Read file
    const buffer = await readFile(filePath)

    logRequest(request, 200, startTime)
    return new Response(buffer, {
      headers: {
        "Content-Type": image.mime,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    })
  } catch (error) {
    logError(error, "GET /i/[file]")
    logRequest(request, 500, startTime)
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500)
  }
}
