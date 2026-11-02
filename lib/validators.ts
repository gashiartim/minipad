import { z } from 'zod'
import {
  MAX_IMAGE_SIZE_BYTES,
  isAllowedImageMime,
} from './image-rules'

export { isValidImageFilename } from './image-rules'

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
          .refine((file) => isAllowedImageMime(file.type), 'Invalid file type')
          .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, 'File too large')
          .refine((file) => file.size > 0, 'File is empty')
      : z.any(),
})

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

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}
