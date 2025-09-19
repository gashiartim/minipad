import { getSocket } from "@/lib/socket-client"
import { io } from "socket.io-client"

// Mock socket.io-client
jest.mock("socket.io-client")
const mockIo = io as jest.MockedFunction<typeof io>

describe("Socket.IO client utilities", () => {
  let mockSocket: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      id: "mock-socket-id"
    }

    mockIo.mockReturnValue(mockSocket)
  })

  afterEach(() => {
    // Reset any global socket state
    jest.resetModules()
  })

  describe("getSocket", () => {
    it("should create a Socket.IO client with correct configuration", () => {
      const socket = getSocket()

      expect(mockIo).toHaveBeenCalledWith({
        path: "/api/socketio",
        addTrailingSlash: false,
      })
      expect(socket).toBe(mockSocket)
    })

    it("should return the same socket instance on subsequent calls (singleton)", () => {
      const socket1 = getSocket()
      const socket2 = getSocket()

      expect(socket1).toBe(socket2)
      expect(mockIo).toHaveBeenCalledTimes(1)
    })
  })
})