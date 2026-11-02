import type { Prisma } from '@prisma/client'
import { generateSlug } from '@/lib/validators'
import { MAX_IMAGES_PER_NOTE } from '@/lib/image-rules'
import { broadcastNoteUpdate, type NoteBroadcastPayload } from '@/lib/socket'
import {
  prismaNoteRepository,
  type NoteRepository,
  type NoteWithImages,
  type PublicImage,
} from './note-repository'
import {
  diskImageStorage,
  type ImageStorage,
  type StoredImageFile,
} from './image-storage'

export type NoteErrorCode =
  | 'NOT_FOUND'
  | 'SLUG_EXISTS'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'TOO_MANY_IMAGES'

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: NoteErrorCode }

export interface NoteBroadcaster {
  noteUpdated(slug: string, payload: NoteBroadcastPayload): void
}

export interface NoteServiceDeps {
  repository: NoteRepository
  storage: ImageStorage
  broadcaster: NoteBroadcaster
}

export type PublicNote = Omit<NoteWithImages, 'secret'>

export interface CreateNoteRequest {
  slug?: string | undefined
  content?: string | undefined
  secret?: string | undefined
}

export interface UpdateNoteInput {
  content?: string | undefined
  contentRich?: string | undefined
  contentFormat?: 'plain' | 'rich' | undefined
  secret?: string | undefined
}

export interface UploadImageInput {
  buffer: Buffer
  originalName: string
  mime: string
  sizeBytes: number
  secret: string | null
}

export interface StoredImage {
  mime: string
  file: StoredImageFile
  etag: string
}

const ok = <T>(value: T): ServiceResult<T> => ({ ok: true, value })
const fail = <T>(error: NoteErrorCode): ServiceResult<T> => ({
  ok: false,
  error,
})

function hasAccess(
  noteSecret: string | null,
  providedSecret: string | null | undefined
): boolean {
  return !noteSecret || noteSecret === providedSecret
}

export function createNoteService({
  repository,
  storage,
  broadcaster,
}: NoteServiceDeps) {
  return {
    async createNote(
      input: CreateNoteRequest
    ): Promise<ServiceResult<{ slug: string }>> {
      const slug = input.slug || generateSlug()

      if (await repository.findBySlug(slug)) return fail('SLUG_EXISTS')

      const note = await repository.create({
        slug,
        content: input.content || '',
        secret: input.secret || null,
      })
      return ok({ slug: note.slug })
    },

    async getNote(
      slug: string,
      secret: string | null
    ): Promise<ServiceResult<PublicNote>> {
      const note = await repository.findBySlugWithImages(slug)
      if (!note) return fail('NOT_FOUND')
      if (!hasAccess(note.secret, secret)) return fail('AUTH_REQUIRED')

      const { secret: _secret, ...publicNote } = note
      void _secret
      return ok(publicNote)
    },

    async updateNote(
      slug: string,
      input: UpdateNoteInput
    ): Promise<ServiceResult<{ ok: true; updatedAt: Date }>> {
      const existing = await repository.findBySlug(slug)
      if (!existing) return fail('NOT_FOUND')
      if (!hasAccess(existing.secret, input.secret)) return fail('FORBIDDEN')

      const { content, contentRich, contentFormat } = input
      const changed =
        (content !== undefined && content !== existing.content) ||
        (contentRich !== undefined && contentRich !== existing.contentRich) ||
        (contentFormat !== undefined &&
          contentFormat !== existing.contentFormat)

      if (!changed) return ok({ ok: true, updatedAt: existing.updatedAt })

      const data: Prisma.NoteUpdateInput = { updatedAt: new Date() }
      if (content !== undefined) data.content = content
      if (contentRich !== undefined) data.contentRich = contentRich
      if (contentFormat !== undefined) data.contentFormat = contentFormat

      const updated = await repository.update(slug, data)

      broadcaster.noteUpdated(slug, {
        type: 'content_update',
        content: updated.content,
        contentRich: updated.contentRich,
        contentFormat: updated.contentFormat,
        updatedAt: updated.updatedAt.toISOString(),
      })

      return ok({ ok: true, updatedAt: updated.updatedAt })
    },

    async uploadImage(
      slug: string,
      input: UploadImageInput
    ): Promise<ServiceResult<PublicImage>> {
      const note = await repository.findBySlug(slug)
      if (!note) return fail('NOT_FOUND')
      if (!hasAccess(note.secret, input.secret)) return fail('FORBIDDEN')
      if ((await repository.countImages(note.id)) >= MAX_IMAGES_PER_NOTE) {
        return fail('TOO_MANY_IMAGES')
      }

      const filename = await storage.save(input.buffer, input.originalName)
      const image = await repository.createImage({
        noteId: note.id,
        path: filename,
        mime: input.mime,
        sizeBytes: input.sizeBytes,
      })

      return ok({
        id: image.id,
        path: image.path,
        mime: image.mime,
        width: image.width,
        height: image.height,
        sizeBytes: image.sizeBytes,
        createdAt: image.createdAt,
      })
    },

    async getImageFile(filename: string): Promise<ServiceResult<StoredImage>> {
      const image = await repository.findImageByPath(filename)
      if (!image) return fail('NOT_FOUND')

      const file = await storage.read(filename)
      if (!file) return fail('NOT_FOUND')

      return ok({
        mime: image.mime,
        file,
        etag: `"${image.id}-${file.modifiedAt.getTime()}"`,
      })
    },
  }
}

export type NoteService = ReturnType<typeof createNoteService>

export const socketNoteBroadcaster: NoteBroadcaster = {
  noteUpdated: (slug, payload) => broadcastNoteUpdate(slug, payload),
}

export const noteService: NoteService = createNoteService({
  repository: prismaNoteRepository,
  storage: diskImageStorage,
  broadcaster: socketNoteBroadcaster,
})
