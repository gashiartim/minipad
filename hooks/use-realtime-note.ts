"use client"

import { useEffect, useRef, useState } from "react"

interface RealtimeNoteUpdate {
  type: "content_update" | "connected" | "heartbeat"
  content?: string
  contentRich?: string
  contentFormat?: "plain" | "rich"
  updatedAt?: string
}

interface UseRealtimeNoteOptions {
  slug: string
  secret?: string
  onUpdate?: (update: RealtimeNoteUpdate) => void
  enabled?: boolean
}

export function useRealtimeNote({ 
  slug, 
  secret, 
  onUpdate, 
  enabled = true 
}: UseRealtimeNoteOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = () => {
    if (!enabled || eventSourceRef.current) return

    try {
      const url = new URL(`/api/notes/${slug}/events`, window.location.origin)
      if (secret) {
        url.searchParams.set("secret", secret)
      }

      const eventSource = new EventSource(url.toString())
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setLastError(null)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeNoteUpdate = JSON.parse(event.data)
          onUpdate?.(data)
        } catch (error) {
          console.warn("Failed to parse SSE message:", error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        setLastError(`Connection lost. Reconnecting in ${delay / 1000}s...`)

        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect()
          }
        }, delay)
      }
    } catch (error) {
      setLastError("Failed to establish connection")
      setIsConnected(false)
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    setLastError(null)
  }

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [slug, secret, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return disconnect
  }, [])

  return {
    isConnected,
    lastError,
    connect: enabled ? connect : undefined,
    disconnect,
  }
}