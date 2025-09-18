import { prisma } from "../lib/db"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

interface BackupData {
  version: string
  timestamp: string
  notes: Array<{
    id: string
    slug: string
    content: string
    secret: string | null
    createdAt: string
    updatedAt: string
  }>
  images: Array<{
    id: string
    noteId: string
    path: string
    mime: string
    width: number | null
    height: number | null
    sizeBytes: number
    createdAt: string
  }>
}

async function restoreBackup(backupFilename: string): Promise<void> {
  try {
    console.log(`🔄 Starting database restore from ${backupFilename}...`)

    const backupPath = path.join(process.cwd(), "backups", backupFilename)

    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    // Read backup file
    const backupContent = await readFile(backupPath, "utf-8")
    const backupData: BackupData = JSON.parse(backupContent)

    console.log(`📅 Backup created: ${backupData.timestamp}`)
    console.log(`📊 Contains ${backupData.notes.length} notes and ${backupData.images.length} images`)

    // Confirm before proceeding
    console.log("⚠️  This will DELETE all existing data and replace it with backup data.")
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Clear existing data
    console.log("🗑️  Clearing existing data...")
    await prisma.image.deleteMany()
    await prisma.note.deleteMany()

    // Restore notes
    console.log("📝 Restoring notes...")
    for (const note of backupData.notes) {
      await prisma.note.create({
        data: {
          id: note.id,
          slug: note.slug,
          content: note.content,
          secret: note.secret,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        },
      })
    }

    // Restore images
    console.log("🖼️  Restoring images...")
    for (const image of backupData.images) {
      await prisma.image.create({
        data: {
          id: image.id,
          noteId: image.noteId,
          path: image.path,
          mime: image.mime,
          width: image.width,
          height: image.height,
          sizeBytes: image.sizeBytes,
          createdAt: new Date(image.createdAt),
        },
      })
    }

    console.log("✅ Database restore completed successfully!")
    console.log(`📊 Restored ${backupData.notes.length} notes and ${backupData.images.length} images`)
  } catch (error) {
    console.error("❌ Restore failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupFilename = process.argv[2]
  if (!backupFilename) {
    console.error("Usage: npm run restore <backup-filename>")
    process.exit(1)
  }
  restoreBackup(backupFilename)
}

export { restoreBackup }
