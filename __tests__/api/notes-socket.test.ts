/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { PUT } from "@/app/api/notes/[slug]/route"
import { prisma } from "@/lib/db"
import { broadcastNoteUpdate } from "@/lib/socket"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/socket")

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBroadcastNoteUpdate = broadcastNoteUpdate as jest.MockedFunction<typeof broadcastNoteUpdate>

describe("/api/notes/[slug] with Socket.IO", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("PUT with Socket.IO broadcasting", () => {
    const mockExistingNote = {
      id: "1",
      slug: "test-note",
      content: "Original content",
      contentRich: "<p>Original content</p>",
      contentFormat: "rich" as const,
      secret: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockUpdatedNote = {
      ...mockExistingNote,
      content: "Updated content",
      contentRich: "<p>Updated content</p>",
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    }

    it("should broadcast update via Socket.IO when note is successfully updated", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(mockExistingNote)
      mockPrisma.note.update.mockResolvedValue(mockUpdatedNote)

      const request = new NextRequest("http://localhost:3000/api/notes/test-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentRich: "<p>Updated content</p>",
          contentFormat: "rich",
        }),
      })

      const response = await PUT(request, { 
        params: Promise.resolve({ slug: "test-note" }) 
      })

      expect(response.status).toBe(200)
      expect(mockBroadcastNoteUpdate).toHaveBeenCalledWith("test-note", {
        type: "content_update",
        content: "Updated content",
        contentRich: "<p>Updated content</p>",
        contentFormat: "rich",
        updatedAt: "2024-01-01T00:00:00.000Z",
      })
    })

    it("should not broadcast when content hasn't changed", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(mockExistingNote)

      const request = new NextRequest("http://localhost:3000/api/notes/test-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentRich: "<p>Original content</p>", // Same as existing
          contentFormat: "rich",
        }),
      })

      const response = await PUT(request, { 
        params: Promise.resolve({ slug: "test-note" }) 
      })

      expect(response.status).toBe(200)
      expect(mockBroadcastNoteUpdate).not.toHaveBeenCalled()
    })

    it("should not broadcast when update fails", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(mockExistingNote)
      mockPrisma.note.update.mockRejectedValue(new Error("Database error"))

      const request = new NextRequest("http://localhost:3000/api/notes/test-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentRich: "<p>Updated content</p>",
          contentFormat: "rich",
        }),
      })

      const response = await PUT(request, { 
        params: Promise.resolve({ slug: "test-note" }) 
      })

      expect(response.status).toBe(500)
      expect(mockBroadcastNoteUpdate).not.toHaveBeenCalled()
    })

    it("should broadcast with correct data for plain text updates", async () => {
      const plainTextNote = {
        ...mockExistingNote,
        content: "Plain text",
        contentRich: "",
        contentFormat: "plain" as const,
      }

      const updatedPlainNote = {
        ...plainTextNote,
        content: "Updated plain text",
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      }

      mockPrisma.note.findUnique.mockResolvedValue(plainTextNote)
      mockPrisma.note.update.mockResolvedValue(updatedPlainNote)

      const request = new NextRequest("http://localhost:3000/api/notes/test-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Updated plain text",
          contentFormat: "plain",
        }),
      })

      const response = await PUT(request, { 
        params: Promise.resolve({ slug: "test-note" }) 
      })

      expect(response.status).toBe(200)
      expect(mockBroadcastNoteUpdate).toHaveBeenCalledWith("test-note", {
        type: "content_update",
        content: "Updated plain text",
        contentRich: "",
        contentFormat: "plain",
        updatedAt: "2024-01-01T00:00:00.000Z",
      })
    })

    it("should handle protected notes with secrets", async () => {
      const protectedNote = {
        ...mockExistingNote,
        secret: "secret123",
      }

      const updatedProtectedNote = {
        ...protectedNote,
        content: "Updated protected content",
        contentRich: "<p>Updated protected content</p>",
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      }

      mockPrisma.note.findUnique.mockResolvedValue(protectedNote)
      mockPrisma.note.update.mockResolvedValue(updatedProtectedNote)

      const request = new NextRequest("http://localhost:3000/api/notes/test-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "secret123",
          contentRich: "<p>Updated protected content</p>",
          contentFormat: "rich",
        }),
      })

      const response = await PUT(request, { 
        params: Promise.resolve({ slug: "test-note" }) 
      })

      expect(response.status).toBe(200)
      expect(mockBroadcastNoteUpdate).toHaveBeenCalledWith("test-note", {
        type: "content_update",
        content: "Updated protected content",
        contentRich: "<p>Updated protected content</p>",
        contentFormat: "rich",
        updatedAt: "2024-01-01T00:00:00.000Z",
      })
    })
  })
})