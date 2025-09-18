import { createSuccessResponse } from "@/lib/api-middleware"

export async function GET() {
  return createSuccessResponse({ ok: true })
}

export async function HEAD() {
  const response = new Response(null, { status: 200 })
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  return response
}
