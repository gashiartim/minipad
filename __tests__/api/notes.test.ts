/**
 * @jest-environment node
 */

import { NextRequest } from "next/server"
import { POST } from "@/app/api/notes/route"
import { prisma } from "@/lib/db"

// Mock the database and Socket.IO
jest.mock("@/lib/db")
jest.mock("@/lib/socket", () => ({
  broadcastNoteUpdate: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/notes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe("POST", () => {
    it("should create a note with generated slug", async () => {
      const mockNote = {
        id: "1",
        slug: "generated-slug",
        content: "",
        secret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.note.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.note.create as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest("http://localhost:3000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slug).toBe("generated-slug")
      expect(mockPrisma.note.create).toHaveBeenCalled()
    })

    it("should create a note with provided slug", async () => {
      const mockNote = {
        id: "1",
        slug: "my-note",
        content: "Hello world",
        secret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.note.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.note.create as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest("http://localhost:3000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "my-note",
          content: "Hello world",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slug).toBe("my-note")
    })

    it("should handle duplicate slug error", async () => {
      ;(mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        id: "existing",
        slug: "existing-slug",
        content: "existing content",
        secret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest("http://localhost:3000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "existing-slug" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe("Slug already exists")
    })

    it("should validate request body", async () => {
      const request = new NextRequest("http://localhost:3000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "ab" }), // too short
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid request data")
    })
  })
})
