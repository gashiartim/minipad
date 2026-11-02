/**
 * @jest-environment node
 */

import type { Image, Note } from "@prisma/client"
import { createNoteService, type NoteBroadcaster } from "@/lib/notes/note-service"
import type { NoteRepository } from "@/lib/notes/note-repository"
import type { ImageStorage } from "@/lib/notes/image-storage"
import { MAX_IMAGES_PER_NOTE } from "@/lib/image-rules"

jest.mock("@/lib/db", () => ({ prisma: {} }))

const baseNote: Note = {
  id: "n1",
  slug: "my-note",
  content: "hello",
  contentRich: "<p>hello</p>",
  contentFormat: "rich",
  secret: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
} as Note

function setup(note: Note | null = baseNote) {
  const repository: jest.Mocked<NoteRepository> = {
    findBySlug: jest.fn().mockResolvedValue(note),
    findBySlugWithImages: jest.fn().mockResolvedValue(note ? { ...note, images: [] } : null),
    create: jest.fn().mockImplementation(async (data) => ({ ...baseNote, ...data })),
    update: jest.fn().mockImplementation(async (_slug, data) => ({ ...baseNote, ...data })),
    countImages: jest.fn().mockResolvedValue(0),
    createImage: jest.fn().mockImplementation(async (data) => ({
      id: "i1",
      width: null,
      height: null,
      createdAt: new Date(),
      ...data,
    }) as Image),
    findImageByPath: jest.fn(),
  }
  const storage: jest.Mocked<ImageStorage> = {
    save: jest.fn().mockResolvedValue("0123456789abcdef-abcd.png"),
    read: jest.fn(),
  }
  const broadcaster: jest.Mocked<NoteBroadcaster> = { noteUpdated: jest.fn() }
  const service = createNoteService({ repository, storage, broadcaster })
  return { service, repository, storage, broadcaster }
}

describe("noteService", () => {
  it("rejects an existing slug", async () => {
    const { service, repository } = setup()
    expect(await service.createNote({ slug: "my-note" })).toEqual({ ok: false, error: "SLUG_EXISTS" })
    expect(repository.create).not.toHaveBeenCalled()
  })

  it("hides the secret and requires it on read", async () => {
    const { service } = setup({ ...baseNote, secret: "s3cret!" })
    expect(await service.getNote("my-note", null)).toEqual({ ok: false, error: "AUTH_REQUIRED" })

    const result = await service.getNote("my-note", "s3cret!")
    expect(result.ok).toBe(true)
    expect(result.ok && "secret" in result.value).toBe(false)
  })

  it("does not write or broadcast when content is unchanged", async () => {
    const { service, repository, broadcaster } = setup()
    const result = await service.updateNote("my-note", { content: "hello" })
    expect(result.ok).toBe(true)
    expect(repository.update).not.toHaveBeenCalled()
    expect(broadcaster.noteUpdated).not.toHaveBeenCalled()
  })

  it("broadcasts after an update", async () => {
    const { service, broadcaster } = setup()
    await service.updateNote("my-note", { content: "changed" })
    expect(broadcaster.noteUpdated).toHaveBeenCalledWith(
      "my-note",
      expect.objectContaining({ type: "content_update", content: "changed" })
    )
  })

  it("refuses an update with the wrong secret", async () => {
    const { service } = setup({ ...baseNote, secret: "s3cret!" })
    expect(await service.updateNote("my-note", { content: "x", secret: "nope" })).toEqual({
      ok: false,
      error: "FORBIDDEN",
    })
  })

  it("stops uploads at the per-note image limit", async () => {
    const { service, repository, storage } = setup()
    repository.countImages.mockResolvedValue(MAX_IMAGES_PER_NOTE)
    const result = await service.uploadImage("my-note", {
      buffer: Buffer.from("x"),
      originalName: "a.png",
      mime: "image/png",
      sizeBytes: 1,
      secret: null,
    })
    expect(result).toEqual({ ok: false, error: "TOO_MANY_IMAGES" })
    expect(storage.save).not.toHaveBeenCalled()
  })

  it("returns NOT_FOUND when the image file is missing on disk", async () => {
    const { service, repository, storage } = setup()
    repository.findImageByPath.mockResolvedValue({ id: "i1", mime: "image/png" } as Image)
    storage.read.mockResolvedValue(null)
    expect(await service.getImageFile("0123456789abcdef-abcd.png")).toEqual({
      ok: false,
      error: "NOT_FOUND",
    })
  })
})
