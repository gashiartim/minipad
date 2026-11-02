import { z } from 'zod'

export const slugSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{3,64}$/, 'Invalid slug format')

export const secretSchema = z
  .string()
  .min(6, 'Secret must be at least 6 characters')
  .max(128, 'Secret must be at most 128 characters')
  .optional()

export const contentSchema = z
  .string()
  .max(200_000, 'Content too long')
  .transform((val) => sanitizeContent(val))

export const createNoteSchema = z.object({
  slug: slugSchema.optional(),
  content: contentSchema.optional().default(''),
  secret: secretSchema,
})

export const contentFormatSchema = z.enum(['plain', 'rich'])

export const updateNoteSchema = z.object({
  content: contentSchema.optional(),
  contentRich: z.string().max(500_000, 'Rich content too long').optional(),
  contentFormat: contentFormatSchema.optional(),
  secret: secretSchema,
})

export const imageUploadSchema = z.object({
  secret: secretSchema,
  file:
    typeof File !== 'undefined'
      ? z
          .instanceof(File)
          .refine(
            (file) =>
              allowedImageTypes.includes(file.type as AllowedImageMime),
            'Invalid file type'
          )
          .refine((file) => file.size <= maxImageSize, 'File too large')
          .refine((file) => file.size > 0, 'File is empty')
      : z.any(),
})

export const allowedImageTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const

export type AllowedImageMime = (typeof allowedImageTypes)[number]

export const maxImageSize = 10 * 1024 * 1024

export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    globalThis.crypto.getRandomValues
  ) {
    const array = new Uint8Array(8)
    globalThis.crypto.getRandomValues(array)
    for (let i = 0; i < 8; i++) {
      result += chars.charAt((array[i] || 0) % chars.length)
    }
  } else {
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }

  return result
}

export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\son\w+\s*=\s*['""][^'"]*['"]/gi, '')
    .replace(/\son\w+\s*=\s*[^'"\s]+/gi, '')
    .trim()
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function isValidImageFilename(filename: string): boolean {
  const filenameRegex = /^[a-f0-9]{16}-[a-z0-9]{4}\.(png|jpg|jpeg|webp|gif)$/i
  return filenameRegex.test(filename) && !filename.includes('..')
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}
