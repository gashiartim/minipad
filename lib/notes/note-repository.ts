import type { Image, Note, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type PublicImage = Pick<
  Image,
  'id' | 'path' | 'mime' | 'width' | 'height' | 'sizeBytes' | 'createdAt'
>

export type NoteWithImages = Note & { images: PublicImage[] }

export interface CreateNoteInput {
  slug: string
  content: string
  secret: string | null
}

export interface CreateImageInput {
  noteId: string
  path: string
  mime: string
  sizeBytes: number
}

export interface NoteRepository {
  findBySlug(slug: string): Promise<Note | null>
  findBySlugWithImages(slug: string): Promise<NoteWithImages | null>
  create(data: CreateNoteInput): Promise<Note>
  update(slug: string, data: Prisma.NoteUpdateInput): Promise<Note>
  countImages(noteId: string): Promise<number>
  createImage(data: CreateImageInput): Promise<Image>
  findImageByPath(path: string): Promise<Image | null>
}

const publicImageSelect = {
  id: true,
  path: true,
  mime: true,
  width: true,
  height: true,
  sizeBytes: true,
  createdAt: true,
} satisfies Prisma.ImageSelect

export const prismaNoteRepository: NoteRepository = {
  findBySlug: (slug) => prisma.note.findUnique({ where: { slug } }),

  findBySlugWithImages: (slug) =>
    prisma.note.findUnique({
      where: { slug },
      include: { images: { select: publicImageSelect } },
    }),

  create: (data) => prisma.note.create({ data }),

  update: (slug, data) => prisma.note.update({ where: { slug }, data }),

  countImages: (noteId) => prisma.image.count({ where: { noteId } }),

  createImage: (data) => prisma.image.create({ data }),

  findImageByPath: (path) => prisma.image.findFirst({ where: { path } }),
}
