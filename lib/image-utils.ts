export function getImageDimensions(buffer: Buffer, mime: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      if (mime === "image/png") {
        if (buffer.length >= 24) {
          const width = buffer.readUInt32BE(16)
          const height = buffer.readUInt32BE(20)
          resolve({ width, height })
          return
        }
      } else if (mime === "image/jpeg") {
        resolve(null)
        return
      }

      resolve(null)
    } catch {
      resolve(null)
    }
  })
}
