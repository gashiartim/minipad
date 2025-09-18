import { prisma } from "../lib/db"
import { readdir, stat } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

async function getDatabaseStats(): Promise<void> {
  try {
    console.log("📊 Generating database statistics...\n")

    // Get note statistics
    const [totalNotes, notesWithSecrets, notesWithContent] = await Promise.all([
      prisma.note.count(),
      prisma.note.count({ where: { secret: { not: null } } }),
      prisma.note.count({ where: { content: { not: "" } } }),
    ])

    // Get image statistics
    const [totalImages, imageStats] = await Promise.all([
      prisma.image.count(),
      prisma.image.aggregate({
        _sum: { sizeBytes: true },
        _avg: { sizeBytes: true },
        _max: { sizeBytes: true },
        _min: { sizeBytes: true },
      }),
    ])

    // Get recent activity
    const recentNotes = await prisma.note.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true },
    })

    // Get disk usage
    let diskUsage = 0
    const uploadsDir = path.join(process.cwd(), "data", "uploads")
    if (existsSync(uploadsDir)) {
      const files = await readdir(uploadsDir)
      for (const file of files) {
        try {
          const filePath = path.join(uploadsDir, file)
          const stats = await stat(filePath)
          diskUsage += stats.size
        } catch (error) {
          // Ignore errors for individual files
        }
      }
    }

    // Display statistics
    console.log("📝 NOTES")
    console.log(`   Total notes: ${totalNotes}`)
    console.log(`   With secrets: ${notesWithSecrets}`)
    console.log(`   With content: ${notesWithContent}`)
    console.log(`   Empty notes: ${totalNotes - notesWithContent}`)

    console.log("\n🖼️  IMAGES")
    console.log(`   Total images: ${totalImages}`)
    if (totalImages > 0) {
      console.log(`   Total size: ${((imageStats._sum.sizeBytes || 0) / 1024 / 1024).toFixed(2)} MB`)
      console.log(`   Average size: ${((imageStats._avg.sizeBytes || 0) / 1024).toFixed(2)} KB`)
      console.log(`   Largest image: ${((imageStats._max.sizeBytes || 0) / 1024).toFixed(2)} KB`)
      console.log(`   Smallest image: ${((imageStats._min.sizeBytes || 0) / 1024).toFixed(2)} KB`)
    }

    console.log("\n💾 DISK USAGE")
    console.log(`   Upload directory: ${(diskUsage / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Database size: ${((imageStats._sum.sizeBytes || 0) / 1024 / 1024).toFixed(2)} MB (tracked)`)

    if (recentNotes.length > 0) {
      console.log("\n🕒 RECENT ACTIVITY")
      for (const note of recentNotes) {
        console.log(`   ${note.slug} - ${note.updatedAt.toLocaleString()}`)
      }
    }

    // Get content statistics
    const contentStats = await prisma.note.findMany({
      select: { content: true },
    })

    const totalChars = contentStats.reduce((sum, note) => sum + note.content.length, 0)
    const avgChars = totalChars / Math.max(contentStats.length, 1)

    console.log("\n📄 CONTENT STATISTICS")
    console.log(`   Total characters: ${totalChars.toLocaleString()}`)
    console.log(`   Average per note: ${Math.round(avgChars)} characters`)
    console.log(`   Total words (approx): ${Math.round(totalChars / 5).toLocaleString()}`)

    console.log("\n✅ Statistics generated successfully!")
  } catch (error) {
    console.error("❌ Failed to generate statistics:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run stats if called directly
if (require.main === module) {
  getDatabaseStats()
}

export { getDatabaseStats }
