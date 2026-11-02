import type { NextRequest } from 'next/server'
import { writeRateLimiter } from './rate-limiter'

export interface ApiError {
  error: string
  code: string
}

export const API_ERRORS = {
  INVALID_SLUG: { status: 400, message: 'Invalid slug format' },
  INVALID_FILENAME: { status: 400, message: 'Invalid filename' },
  VALIDATION_ERROR: { status: 400, message: 'Invalid request data' },
  NO_FILE: { status: 400, message: 'No file provided' },
  TOO_MANY_IMAGES: { status: 400, message: 'Maximum images per note exceeded' },
  AUTH_REQUIRED: { status: 401, message: 'Authentication required' },
  FORBIDDEN: { status: 403, message: 'Invalid or missing secret' },
  NOT_FOUND: { status: 404, message: 'Note not found' },
  SLUG_EXISTS: { status: 409, message: 'Slug already exists' },
  REQUEST_TOO_LARGE: { status: 413, message: 'Request too large' },
  FILE_TOO_LARGE: { status: 413, message: 'File too large' },
  INVALID_TYPE: { status: 415, message: 'Invalid file type' },
  RATE_LIMITED: { status: 429, message: 'Too many requests' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
} as const satisfies Record<string, { status: number; message: string }>

export type ApiErrorCode = keyof typeof API_ERRORS

export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

export function createErrorResponse(
  message: string,
  code: string,
  status: number
): Response {
  const response = new Response(
    JSON.stringify({ error: message, code } as ApiError),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
  addSecurityHeaders(response)
  return response
}

export function apiError(code: ApiErrorCode, message?: string): Response {
  const definition = API_ERRORS[code]
  return createErrorResponse(
    message ?? definition.message,
    code,
    definition.status
  )
}

export function createSuccessResponse(data: unknown, status = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  addSecurityHeaders(response)
  return response
}

export function addSecurityHeaders(response: Response): void {
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
}

export function validateRequestSize(
  request: NextRequest,
  maxSize: number = DEFAULT_MAX_BODY_BYTES
): boolean {
  const contentLength = request.headers.get('content-length')
  return !(contentLength && Number.parseInt(contentLength) > maxSize)
}

export function checkRateLimit(request: NextRequest): {
  allowed: boolean
  response?: Response
} {
  const { allowed, resetTime } = writeRateLimiter.checkLimit(request)

  if (allowed) return { allowed: true }

  const response = apiError('RATE_LIMITED')
  response.headers.set(
    'Retry-After',
    Math.ceil((resetTime - Date.now()) / 1000).toString()
  )
  response.headers.set(
    'X-RateLimit-Limit',
    writeRateLimiter.maxRequests.toString()
  )
  response.headers.set('X-RateLimit-Remaining', '0')
  response.headers.set(
    'X-RateLimit-Reset',
    Math.ceil(resetTime / 1000).toString()
  )

  return { allowed: false, response }
}

export function logRequest(
  request: NextRequest,
  status: number,
  startTime: number
): void {
  const duration = Date.now() - startTime
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  console.log(
    `${request.method} ${request.nextUrl.pathname} ${status} ${duration}ms [${ip}]`
  )
}

export function logError(error: unknown, context: string): void {
  console.error(`[API Error] ${context}:`, error)
}

export interface WithApiOptions {
  rateLimit?: boolean
  maxBodyBytes?: number
}

interface RouteContext<P> {
  params: Promise<P>
}

type ApiHandler<P> = (request: NextRequest, params: P) => Promise<Response>

export function withApi(
  handler: ApiHandler<Record<string, never>>,
  options?: WithApiOptions
): (request: NextRequest) => Promise<Response>
export function withApi<P extends Record<string, string>>(
  handler: ApiHandler<P>,
  options?: WithApiOptions
): (request: NextRequest, context: RouteContext<P>) => Promise<Response>
export function withApi<P extends Record<string, string>>(
  handler: ApiHandler<P>,
  options: WithApiOptions = {}
) {
  return async (
    request: NextRequest,
    context?: RouteContext<P>
  ): Promise<Response> => {
    const startTime = Date.now()
    let response: Response

    try {
      response = await run()
    } catch (error) {
      logError(error, `${request.method} ${request.nextUrl.pathname}`)
      response = apiError('INTERNAL_ERROR')
    }

    logRequest(request, response.status, startTime)
    return response

    async function run(): Promise<Response> {
      if (options.rateLimit) {
        const rateLimit = checkRateLimit(request)
        if (!rateLimit.allowed) return rateLimit.response!
      }

      if (
        options.maxBodyBytes !== undefined &&
        !validateRequestSize(request, options.maxBodyBytes)
      ) {
        return apiError('REQUEST_TOO_LARGE')
      }

      const params = (context ? await context.params : {}) as P
      return handler(request, params)
    }
  }
}
