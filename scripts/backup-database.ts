import { prisma } from "../lib/db"
import { writeFile, mkdir } from "fs/promises"
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

async function createBackup(): Promise<void> {
  try {
    console.log("🔄 Starting database backup...")

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), "backups")
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true })
    }

    // Fetch all data
    const [notes, images] = await Promise.all([
      prisma.note.findMany({
        orderBy: { createdAt: "asc" },
      }),
      prisma.image.findMany({
        orderBy: { createdAt: "asc" },
      }),
    ])

    // Create backup data
    const backupData: BackupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      notes: notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
      images: images.map((image) => ({
        ...image,
        createdAt: image.createdAt.toISOString(),
      })),
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup-${timestamp}.json`
    const filepath = path.join(backupDir, filename)

    // Write backup file
    await writeFile(filepath, JSON.stringify(backupData, null, 2), "utf-8")

    console.log(`✅ Backup created successfully: ${filename}`)
    console.log(`📊 Backed up ${notes.length} notes and ${images.length} images`)
    console.log(`📁 Location: ${filepath}`)
  } catch (error) {
    console.error("❌ Backup failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run backup if called directly
if (require.main === module) {
  createBackup()
}

export { createBackup }
