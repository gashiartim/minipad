import type { NextRequest } from "next/server"
import { slugSchema } from "@/lib/validators"
import { logRequest } from "@/lib/api-middleware"

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Store active connections for each note
const connections = new Map<string, Set<ReadableStreamDefaultController<any>>>()

// Helper to broadcast updates to all connected clients for a note
export function broadcastNoteUpdate(slug: string, data: any) {
  const noteConnections = connections.get(slug)
  if (!noteConnections) return

  const message = `data: ${JSON.stringify(data)}\n\n`
  const encoder = new TextEncoder()
  
  // Send to all connected clients, remove failed connections
  const failedConnections = new Set<ReadableStreamDefaultController<any>>()
  
  for (const controller of noteConnections) {
    try {
      controller.enqueue(encoder.encode(message))
    } catch (error) {
      failedConnections.add(controller)
    }
  }

  // Clean up failed connections
  failedConnections.forEach(controller => noteConnections.delete(controller))
  if (noteConnections.size === 0) {
    connections.delete(slug)
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { slug } = await params
    const url = new URL(request.url)
    const secret = url.searchParams.get("secret")

    // Validate slug
    const slugValidation = slugSchema.safeParse(slug)
    if (!slugValidation.success) {
      logRequest(request, 400, startTime)
      return new Response("Invalid slug format", { status: 400 })
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"))

        // Add this controller to connections map
        if (!connections.has(slug)) {
          connections.set(slug, new Set())
        }
        connections.get(slug)!.add(controller)

        // Set up periodic heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode("data: {\"type\":\"heartbeat\"}\n\n"))
          } catch (error) {
            clearInterval(heartbeat)
            connections.get(slug)?.delete(controller)
          }
        }, 30000) // 30 second heartbeat

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          connections.get(slug)?.delete(controller)
          if (connections.get(slug)?.size === 0) {
            connections.delete(slug)
          }
        })
      }
    })

    logRequest(request, 200, startTime)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    logRequest(request, 500, startTime)
    return new Response("Internal server error", { status: 500 })
  }
}