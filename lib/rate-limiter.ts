interface RateLimitEntry {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 60, windowMs: number = 5 * 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  private getClientIP(request: Request): string {
    // Try various headers for IP detection
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const cfConnectingIP = request.headers.get("cf-connecting-ip")

    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown"
    }

    return realIP || cfConnectingIP || "unknown"
  }

  public checkLimit(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const clientIP = this.getClientIP(request)
    const now = Date.now()
    const key = `rate_limit:${clientIP}`

    let entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      this.store.set(key, entry)

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

// Global rate limiter instance for write operations
export const writeRateLimiter = new InMemoryRateLimiter(60, 5 * 60 * 1000) // 60 requests per 5 minutes

// Mutex for preventing concurrent writes to same note
class NoteMutex {
  private locks = new Set<string>()

  async acquire(slug: string): Promise<() => void> {
    while (this.locks.has(slug)) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    this.locks.add(slug)

    return () => {
      this.locks.delete(slug)
    }
  }
}

export const noteMutex = new NoteMutex()
