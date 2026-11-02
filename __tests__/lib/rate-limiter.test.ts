import { writeRateLimiter, noteMutex } from "@/lib/rate-limiter"
import { jest } from "@jest/globals"

describe("Rate Limiter", () => {
  beforeEach(() => {
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
    } as any

    const mockRequest2 = {
      headers: {
        get: jest.fn().mockReturnValue("192.168.1.1"),
      },
    } as any

    for (let i = 0; i < 60; i++) {
      writeRateLimiter.checkLimit(mockRequest1)
    }

    expect(writeRateLimiter.checkLimit(mockRequest1).allowed).toBe(false)

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

    const promise = noteMutex.acquire("test-slug").then(() => {
      acquired = true
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(acquired).toBe(false)

    release1()

    await promise
    expect(acquired).toBe(true)
  })
})
