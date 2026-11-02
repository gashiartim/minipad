import { mkdir } from "fs/promises"
import { createHash } from "crypto"
import path from "path"

export function getDataDir(): string {
  return path.join(process.cwd(), "data")
}

export function getUploadsDir(): string {
  return path.join(getDataDir(), "uploads")
}

export async function ensureUploadsDir(): Promise<string> {
  const uploadsDir = getUploadsDir()
  await mkdir(uploadsDir, { recursive: true })
  return uploadsDir
}

export function generateImageFilename(buffer: Buffer, originalName: string): string {
  const hash = createHash("sha256").update(new Uint8Array(buffer)).digest("hex")
  const ext = path.extname(originalName).toLowerCase()
  const randomSuffix = Math.random().toString(36).substring(2, 6).padEnd(4, "0")
  return `${hash.substring(0, 16)}-${randomSuffix}${ext}`
}
