import { writeRateLimiter, noteMutex } from "@/lib/rate-limiter"
import { jest } from "@jest/globals"

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Clear rate limiter state
    ;(writeRateLimiter as any).store.clear()
  })

  it("should allow requests within limit", () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as any

    const result = writeRateLimiter.checkLimit(mockRequest)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(59)
  })

  it("should block requests over limit", () => {
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as any

    // Make 60 requests (the limit)
    for (let i = 0; i < 60; i++) {
      writeRateLimiter.checkLimit(mockRequest)
    }

    // 61st request should be blocked
    const result = writeRateLimiter.checkLimit(mockRequest)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("should handle different IP addresses separately", () => {
    const mockRequest1 = {
      headers: {
        get: jest.fn().mockReturnValue("127.0.0.1"),
      },
    } as any

    const mockRequest2 = {
      headers: {
        get: jest.fn().mockReturnValue("192.168.1.1"),
      },
    } as any

    // Make 60 requests from first IP
    for (let i = 0; i < 60; i++) {
      writeRateLimiter.checkLimit(mockRequest1)
    }

    // First IP should be blocked
    expect(writeRateLimiter.checkLimit(mockRequest1).allowed).toBe(false)

    // Second IP should still be allowed
    expect(writeRateLimiter.checkLimit(mockRequest2).allowed).toBe(true)
  })
})

describe("Note Mutex", () => {
  it("should allow acquiring lock for different slugs", async () => {
    const release1 = await noteMutex.acquire("slug1")
    const release2 = await noteMutex.acquire("slug2")

    expect(typeof release1).toBe("function")
    expect(typeof release2).toBe("function")

    release1()
    release2()
  })

  it("should block concurrent access to same slug", async () => {
    let acquired = false
    const release1 = await noteMutex.acquire("test-slug")

    // Try to acquire the same slug (should block)
    const promise = noteMutex.acquire("test-slug").then(() => {
      acquired = true
    })

    // Should not be acquired yet
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(acquired).toBe(false)

    // Release the lock
    release1()

    // Now it should be acquired
    await promise
    expect(acquired).toBe(true)
  })
})
