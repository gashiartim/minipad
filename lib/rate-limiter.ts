interface RateLimitEntry {
  count: number
  resetTime: number
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  readonly maxRequests: number
  readonly windowMs: number

  constructor(maxRequests = 60, windowMs: number = 5 * 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    const timer = setInterval(() => this.cleanup(), 60 * 1000)
    timer.unref?.()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  reset(): void {
    this.store.clear()
  }

  private getClientIP(request: Request): string {
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

export const writeRateLimiter = new InMemoryRateLimiter(60, 5 * 60 * 1000)
