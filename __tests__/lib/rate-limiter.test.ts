import { writeRateLimiter } from "@/lib/rate-limiter"
import { jest } from "@jest/globals"

describe("Rate Limiter", () => {
  beforeEach(() => {
    writeRateLimiter.reset()
  })

  it("should allow requests within limit", () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as unknown as Request

    const result = writeRateLimiter.checkLimit(mockRequest)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(59)
  })

  it("should block requests over limit", () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as unknown as Request

    for (let i = 0; i < 60; i++) {
      writeRateLimiter.checkLimit(mockRequest)
    }

    const result = writeRateLimiter.checkLimit(mockRequest)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("should handle different IP addresses separately", () => {
    const mockRequest1 = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as unknown as Request

    const mockRequest2 = {
      headers: {
        get: jest.fn().mockReturnValue("192.168.1.1"),
      },
    } as unknown as Request

    for (let i = 0; i < 60; i++) {
      writeRateLimiter.checkLimit(mockRequest1)
    }

    expect(writeRateLimiter.checkLimit(mockRequest1).allowed).toBe(false)

    expect(writeRateLimiter.checkLimit(mockRequest2).allowed).toBe(true)
  })
})
