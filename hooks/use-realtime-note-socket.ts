"use client"

import { useEffect, useState, useCallback } from "react"
import { getSocket } from "@/lib/socket-client"

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

  const handleConnect = useCallback(() => {
    const socket = getSocket()
    console.log("Socket connected:", socket.id)
    setIsConnected(true)
    setLastError(null)
    
    // Join the note room
    socket.emit("join-note", slug)
  }, [slug])

  const handleDisconnect = useCallback(() => {
    console.log("Socket disconnected")
    setIsConnected(false)
  }, [])

  const handleConnectError = useCallback((error: any) => {
    console.error("Socket connection error:", error)
    setLastError("Connection failed")
    setIsConnected(false)
  }, [])

  const handleNoteUpdate = useCallback((data: RealtimeNoteUpdate) => {
    console.log("Received note update:", data)
    onUpdate?.(data)
  }, [onUpdate])

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
    }
  }, [slug, enabled, handleConnect, handleDisconnect, handleConnectError, handleNoteUpdate])

  const disconnect = useCallback(() => {
    const socket = getSocket()
    socket.emit("leave-note", slug)
    socket.disconnect()
    setIsConnected(false)
    setLastError(null)
  }, [slug])

  return {
    isConnected,
    lastError,
    disconnect,
  }
}