"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { getSocket } from "@/lib/socket-client"
import { TIMING } from "@/lib/constants"

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

export function useRealtimeNoteSocket({ 
  slug, 
  secret, 
  onUpdate, 
  enabled = true 
}: UseRealtimeNoteOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const onUpdateRef = useRef(onUpdate)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Keep ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const handleConnect = useCallback(() => {
    const socket = getSocket()
    setIsConnected(true)
    setLastError(null)
    setReconnectAttempts(0) // Reset reconnect attempts on successful connection
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Join the note room
    socket.emit("join-note", slug)
  }, [slug])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const handleConnectError = useCallback((error: Error | string) => {
    console.error("Socket connection error:", error)
    setLastError("Connection failed")
    setIsConnected(false)
    
    // Implement exponential backoff for reconnection
    const backoffDelay = Math.min(
      TIMING.WEBSOCKET_RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts),
      TIMING.WEBSOCKET_RECONNECT_MAX_DELAY
    )
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1)
      const socket = getSocket()
      socket.connect()
    }, backoffDelay)
  }, [reconnectAttempts])

  const handleNoteUpdate = useCallback((data: RealtimeNoteUpdate) => {
    onUpdateRef.current?.(data)
  }, []) // No dependencies - uses ref

  useEffect(() => {
    if (!enabled) {
      const socket = getSocket()
      socket.emit("leave-note", slug)
      setIsConnected(false)
      return
    }

    const socket = getSocket()

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("note-update", handleNoteUpdate)

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup function
    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("note-update", handleNoteUpdate)
      socket.emit("leave-note", slug)
      
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [slug, enabled, handleConnect, handleDisconnect, handleConnectError, handleNoteUpdate])

  const disconnect = useCallback(() => {
    const socket = getSocket()
    socket.emit("leave-note", slug)
    socket.disconnect()
    setIsConnected(false)
    setLastError(null)
    setReconnectAttempts(0)
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [slug])

  return {
    isConnected,
    lastError,
    disconnect,
  }
}