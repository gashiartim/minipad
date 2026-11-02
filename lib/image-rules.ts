export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
] as const

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
export const MAX_IMAGE_UPLOAD_REQUEST_BYTES =
  MAX_IMAGE_SIZE_BYTES + 2 * 1024 * 1024
export const MAX_IMAGES_PER_NOTE = 100

export const IMAGE_DIMENSION_LIMITS = {
  min: { width: 1, height: 1 },
  max: { width: 4000, height: 4000 },
} as const

export const IMAGE_FILE_SIGNATURES: Readonly<
  Record<string, readonly number[]>
> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/jpg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
}

export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_MIME_TYPES.join(',')

const IMAGE_FILENAME_PATTERN =
  /^[a-f0-9]{16}-[a-z0-9]{4}\.(png|jpg|jpeg|webp|gif)$/i

export function isAllowedImageMime(mime: string): mime is AllowedImageMime {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    mime.toLowerCase()
  )
}

export function isAllowedImageExtension(filename: string): boolean {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return false
  const ext = filename.slice(dot).toLowerCase()
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)
}

export function isValidImageFilename(filename: string): boolean {
  return IMAGE_FILENAME_PATTERN.test(filename) && !filename.includes('..')
}
