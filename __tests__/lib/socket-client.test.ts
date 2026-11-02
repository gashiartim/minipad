import { getSocket, resetSocketClient } from "@/lib/socket-client"
import { io, type Socket } from "socket.io-client"

interface MockSocket {
  connected: boolean
  id: string
  on: jest.Mock
  off: jest.Mock
  emit: jest.Mock
  disconnect: jest.Mock
}

jest.mock("socket.io-client")
const mockIo = io as jest.MockedFunction<typeof io>

describe("Socket.IO client utilities", () => {
  let mockSocket: MockSocket

  beforeEach(() => {
    resetSocketClient()
    jest.clearAllMocks()
    
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      id: "mock-socket-id"
    }

    mockIo.mockReturnValue(mockSocket as unknown as Socket)
  })

  afterEach(() => {
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