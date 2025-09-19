"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | undefined

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    })
  }
  return socket
}