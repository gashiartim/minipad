import { readFile, stat, writeFile } from 'fs/promises'
import path from 'path'
import {
  ensureUploadsDir,
  generateImageFilename,
  getUploadsDir,
} from '@/lib/server-utils'

export interface StoredImageFile {
  buffer: Buffer
  modifiedAt: Date
}

export interface ImageStorage {
  save(buffer: Buffer, originalName: string): Promise<string>
  read(filename: string): Promise<StoredImageFile | null>
}

export const diskImageStorage: ImageStorage = {
  async save(buffer, originalName) {
    const filename = generateImageFilename(buffer, originalName)
    const uploadsDir = await ensureUploadsDir()
    await writeFile(path.join(uploadsDir, filename), new Uint8Array(buffer))
    return filename
  },

  async read(filename) {
    const filePath = path.join(getUploadsDir(), filename)
    try {
      const [stats, buffer] = await Promise.all([
        stat(filePath),
        readFile(filePath),
      ])
      return { buffer, modifiedAt: stats.mtime }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  },
}
