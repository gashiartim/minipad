import { Server as SocketIOServer } from "socket.io"

declare global {
  var io: SocketIOServer | undefined
}

export const getSocketIO = (): SocketIOServer | undefined => {
  return globalThis.io
}

export const broadcastNoteUpdate = (slug: string, data: any) => {
  const socketIO = getSocketIO()
  if (!socketIO) {
    console.warn("Socket.IO not initialized, cannot broadcast update")
    return
  }

  console.log(`Broadcasting update to note:${slug}`, data)
  socketIO.to(`note:${slug}`).emit("note-update", data)
}