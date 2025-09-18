import type { NextRequest } from "next/server"
import { writeRateLimiter, noteMutex } from "./rate-limiter"

export interface ApiError {
  error: string
  code: string
}

export function createErrorResponse(message: string, code: string, status: number): Response {
  const response = new Response(JSON.stringify({ error: message, code } as ApiError), { 
    status,
    headers: { "Content-Type": "application/json" }
  })
  addSecurityHeaders(response)
  return response
}

export function createSuccessResponse(data: any, status = 200): Response {
  const response = new Response(JSON.stringify(data), { 
    status,
    headers: { "Content-Type": "application/json" }
  })
  addSecurityHeaders(response)
  return response
}

export function addSecurityHeaders(response: Response): void {
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
}

export function validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > maxSize) {
    return false
  }
  return true
}

export function checkRateLimit(request: NextRequest): { allowed: boolean; response?: Response } {
  const { allowed, remaining, resetTime } = writeRateLimiter.checkLimit(request)

  if (!allowed) {
    const response = createErrorResponse("Too many requests", "RATE_LIMITED", 429)
    response.headers.set("Retry-After", Math.ceil((resetTime - Date.now()) / 1000).toString())
    response.headers.set("X-RateLimit-Limit", "60")
    response.headers.set("X-RateLimit-Remaining", "0")
    response.headers.set("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString())

    return { allowed: false, response }
  }

  return { allowed: true }
}

export async function acquireNoteLock(slug: string): Promise<() => void> {
  return await noteMutex.acquire(slug)
}

export function logRequest(request: NextRequest, status: number, startTime: number): void {
  const duration = Date.now() - startTime
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  console.log(`${request.method} ${request.nextUrl.pathname} ${status} ${duration}ms [${ip}]`)
}

export function logError(error: unknown, context: string): void {
  console.error(`[API Error] ${context}:`, error)
}
