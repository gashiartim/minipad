import { prisma } from "../lib/db"
import { readdir, unlink, stat } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

async function cleanupOrphanedImages(): Promise<void> {
  try {
    console.log("🔄 Starting orphaned images cleanup...")

    const uploadsDir = path.join(process.cwd(), "data", "uploads")

    if (!existsSync(uploadsDir)) {
      console.log("📁 No uploads directory found, nothing to clean up")
      return
    }

    // Get all image files from filesystem
    const files = await readdir(uploadsDir)
    const imageFiles = files.filter((file) => /\.(png|jpg|jpeg|webp|gif)$/i.test(file))

    console.log(`📊 Found ${imageFiles.length} image files on disk`)

    // Get all image records from database
    const dbImages = await prisma.image.findMany({
      select: { path: true },
    })

    const dbImagePaths = new Set(dbImages.map((img) => img.path))
    console.log(`📊 Found ${dbImages.length} image records in database`)

    // Find orphaned files (on disk but not in database)
    const orphanedFiles: string[] = []
    const missingFiles: string[] = []
    let totalSize = 0

    for (const file of imageFiles) {
      if (!dbImagePaths.has(file)) {
        orphanedFiles.push(file)
        const filePath = path.join(uploadsDir, file)
        const stats = await stat(filePath)
        totalSize += stats.size
      }
    }

    // Find missing files (in database but not on disk)
    for (const dbImage of dbImages) {
      const filePath = path.join(uploadsDir, dbImage.path)
      if (!existsSync(filePath)) {
        missingFiles.push(dbImage.path)
      }
    }

    console.log(`🗑️  Found ${orphanedFiles.length} orphaned files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`❌ Found ${missingFiles.length} missing files`)

    if (orphanedFiles.length === 0 && missingFiles.length === 0) {
      console.log("✅ No cleanup needed - all files are properly tracked")
      return
    }

    // List orphaned files
    if (orphanedFiles.length > 0) {
      console.log("\n🗑️  Orphaned files to be deleted:")
      for (const file of orphanedFiles) {
        console.log(`  - ${file}`)
      }
    }

    // List missing files
    if (missingFiles.length > 0) {
      console.log("\n❌ Missing files (database records will be cleaned up):")
      for (const file of missingFiles) {
        console.log(`  - ${file}`)
      }
    }

    // Confirm before proceeding
    console.log("\n⚠️  This will permanently delete orphaned files and clean up missing file records.")
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Delete orphaned files
    let deletedFiles = 0
    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(uploadsDir, file)
        await unlink(filePath)
        deletedFiles++
        console.log(`🗑️  Deleted: ${file}`)
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error)
      }
    }

    // Clean up missing file records
    let cleanedRecords = 0
    for (const file of missingFiles) {
      try {
        await prisma.image.deleteMany({
          where: { path: file },
        })
        cleanedRecords++
        console.log(`🧹 Cleaned record: ${file}`)
      } catch (error) {
        console.error(`❌ Failed to clean record ${file}:`, error)
      }
    }

    console.log(`\n✅ Cleanup completed!`)
    console.log(`🗑️  Deleted ${deletedFiles} orphaned files`)
    console.log(`🧹 Cleaned ${cleanedRecords} missing file records`)
    console.log(`💾 Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB of disk space`)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupOrphanedImages()
}

export { cleanupOrphanedImages }
