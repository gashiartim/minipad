import { renderHook, act } from "@testing-library/react"
import { useRealtimeNoteSocket } from "@/hooks/use-realtime-note-socket"
import { getSocket } from "@/lib/socket-client"

// Mock the socket client
jest.mock("@/lib/socket-client")
const mockGetSocket = getSocket as jest.MockedFunction<typeof getSocket>

describe("useRealtimeNoteSocket", () => {
  let mockSocket: any

  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnUpdate.mockClear()
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      id: "mock-socket-id"
    }

    mockGetSocket.mockReturnValue(mockSocket)
  })

  const getDefaultProps = () => ({
    slug: "test-note",
    secret: "test-secret",
    onUpdate: mockOnUpdate,
    enabled: true,
  })

  describe("initialization", () => {
    it("should set up socket event listeners when enabled", () => {
      renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith("connect_error", expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith("note-update", expect.any(Function))
    })

    it("should not set up listeners when disabled", () => {
      renderHook(() => useRealtimeNoteSocket({
        ...getDefaultProps(),
        enabled: false
      }))

      expect(mockSocket.emit).toHaveBeenCalledWith("leave-note", "test-note")
      expect(mockSocket.on).not.toHaveBeenCalled()
    })

    it("should join note room if already connected", () => {
      mockSocket.connected = true
      
      renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      // Should call handleConnect which emits join-note
      expect(mockSocket.emit).toHaveBeenCalledWith("join-note", "test-note")
    })
  })

  describe("connection state", () => {
    it("should update connection state on connect", () => {
      const { result } = renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      // Simulate socket connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "connect"
      )?.[1]

      act(() => {
        connectHandler?.()
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.lastError).toBe(null)
      expect(mockSocket.emit).toHaveBeenCalledWith("join-note", "test-note")
    })

    it("should update connection state on disconnect", () => {
      const { result } = renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "connect"
      )?.[1]
      act(() => connectHandler?.())

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "disconnect"
      )?.[1]

      act(() => {
        disconnectHandler?.()
      })

      expect(result.current.isConnected).toBe(false)
    })

    it("should handle connection errors", () => {
      const { result } = renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "connect_error"
      )?.[1]

      act(() => {
        errorHandler?.(new Error("Connection failed"))
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.lastError).toBe("Connection failed")
    })
  })

  describe("note updates", () => {
    it("should call onUpdate when receiving note-update event", () => {
      renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      // Get the note-update handler that was registered
      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "note-update"
      )?.[1]

      expect(updateHandler).toBeDefined()

      const updateData = {
        type: "content_update" as const,
        content: "New content",
        contentRich: "<p>New content</p>",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }

      act(() => {
        updateHandler?.(updateData)
      })

      expect(mockOnUpdate).toHaveBeenCalledWith(updateData)
    })

    it("should handle different update types", () => {
      renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === "note-update"
      )?.[1]

      expect(updateHandler).toBeDefined()

      const heartbeat = { type: "heartbeat" as const }
      const connected = { type: "connected" as const }

      act(() => {
        updateHandler?.(heartbeat)
      })

      act(() => {
        updateHandler?.(connected)
      })

      expect(mockOnUpdate).toHaveBeenCalledWith(heartbeat)
      expect(mockOnUpdate).toHaveBeenCalledWith(connected)
      expect(mockOnUpdate).toHaveBeenCalledTimes(2)
    })
  })

  describe("cleanup", () => {
    it("should remove event listeners and leave room on unmount", () => {
      const { unmount } = renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      unmount()

      expect(mockSocket.off).toHaveBeenCalledWith("connect", expect.any(Function))
      expect(mockSocket.off).toHaveBeenCalledWith("disconnect", expect.any(Function))
      expect(mockSocket.off).toHaveBeenCalledWith("connect_error", expect.any(Function))
      expect(mockSocket.off).toHaveBeenCalledWith("note-update", expect.any(Function))
      expect(mockSocket.emit).toHaveBeenCalledWith("leave-note", "test-note")
    })

    it("should leave room when slug changes", () => {
      const { rerender } = renderHook(
        ({ slug }) => useRealtimeNoteSocket({ ...getDefaultProps(), slug }),
        { initialProps: { slug: "note-1" } }
      )

      // Clear previous calls
      mockSocket.emit.mockClear()
      
      rerender({ slug: "note-2" })

      // Should leave old room and join new room (may require checking call order)
      const emitCalls = mockSocket.emit.mock.calls
      expect(emitCalls.some(call => call[0] === "leave-note" && call[1] === "note-1")).toBe(true)
      // Note: The join-note for note-2 might happen in the next effect cycle
    })
  })

  describe("disconnect method", () => {
    it("should manually disconnect and leave room", () => {
      const { result } = renderHook(() => useRealtimeNoteSocket(getDefaultProps()))

      act(() => {
        result.current.disconnect()
      })

      expect(mockSocket.emit).toHaveBeenCalledWith("leave-note", "test-note")
      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(result.current.isConnected).toBe(false)
      expect(result.current.lastError).toBe(null)
    })
  })
})