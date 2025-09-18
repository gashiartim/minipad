export function getImageDimensions(buffer: Buffer, mime: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      // Basic image dimension parsing for common formats
      // This is a simplified version - in production you'd use sharp or similar
      if (mime === "image/png") {
        // PNG: width and height are at bytes 16-19 and 20-23
        if (buffer.length >= 24) {
          const width = buffer.readUInt32BE(16)
          const height = buffer.readUInt32BE(20)
          resolve({ width, height })
          return
        }
      } else if (mime === "image/jpeg") {
        // JPEG parsing is more complex, skip for now
        resolve(null)
        return
      }

      resolve(null)
    } catch {
      resolve(null)
    }
  })
}
