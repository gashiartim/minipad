import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "data", "uploads")
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
  return uploadsDir
}

export function generateImageFilename(buffer: Buffer, originalName: string): string {
  const crypto = require("crypto")
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  const ext = path.extname(originalName).toLowerCase()
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${hash.substring(0, 16)}-${randomSuffix}${ext}`
}