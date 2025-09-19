import { getSocketIO, broadcastNoteUpdate } from "@/lib/socket"
import { Server as SocketIOServer } from "socket.io"

describe("Socket.IO utilities", () => {
  let mockSocketIO: jest.Mocked<SocketIOServer>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Socket.IO server
    mockSocketIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any

    // Mock global io
    ;(globalThis as any).io = mockSocketIO
  })

  afterEach(() => {
    ;(globalThis as any).io = undefined
  })

  describe("getSocketIO", () => {
    it("should return the global Socket.IO instance when available", () => {
      const result = getSocketIO()
      expect(result).toBe(mockSocketIO)
    })

    it("should return undefined when Socket.IO is not initialized", () => {
      ;(globalThis as any).io = undefined
      const result = getSocketIO()
      expect(result).toBeUndefined()
    })
  })

  describe("broadcastNoteUpdate", () => {
    const testSlug = "test-note"
    const testData = {
      type: "content_update" as const,
      content: "Updated content",
      contentRich: "<p>Updated content</p>",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }

    it("should broadcast update to correct note room", () => {
      broadcastNoteUpdate(testSlug, testData)

      expect(mockSocketIO.to).toHaveBeenCalledWith(`note:${testSlug}`)
      expect(mockSocketIO.emit).toHaveBeenCalledWith("note-update", testData)
    })

    it("should handle missing Socket.IO gracefully", () => {
      ;(globalThis as any).io = undefined
      
      // Mock console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation()
      
      expect(() => {
        broadcastNoteUpdate(testSlug, testData)
      }).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "Socket.IO not initialized, cannot broadcast update"
      )
      
      consoleSpy.mockRestore()
    })

    it("should handle different update types", () => {
      const heartbeatData = { type: "heartbeat" as const }
      const connectData = { type: "connected" as const }

      broadcastNoteUpdate(testSlug, heartbeatData)
      broadcastNoteUpdate(testSlug, connectData)

      expect(mockSocketIO.to).toHaveBeenCalledTimes(2)
      expect(mockSocketIO.emit).toHaveBeenCalledWith("note-update", heartbeatData)
      expect(mockSocketIO.emit).toHaveBeenCalledWith("note-update", connectData)
    })
  })
})