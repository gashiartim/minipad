"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | undefined

/** Clears the cached Socket.IO client (for tests; safe to call multiple times). */
export function resetSocketClient(): void {
  socket = undefined
}

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    })
  }
  return socket
}
