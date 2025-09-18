import { prisma } from "../lib/db"
import { writeFile, mkdir, copyFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

async function exportNotes(): Promise<void> {
  try {
    console.log("🔄 Starting notes export...")

    // Create export directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const exportDir = path.join(process.cwd(), "exports", `export-${timestamp}`)
    await mkdir(exportDir, { recursive: true })

    // Fetch all notes with images
    const notes = await prisma.note.findMany({
      include: {
        images: true,
      },
      orderBy: { createdAt: "asc" },
    })

    console.log(`📊 Found ${notes.length} notes to export`)

    // Export each note as markdown
    for (const note of notes) {
      const noteDir = path.join(exportDir, note.slug)
      await mkdir(noteDir, { recursive: true })

      // Create markdown content
      let markdown = `# ${note.slug}\n\n`
      markdown += `**Created:** ${note.createdAt.toISOString()}\n`
      markdown += `**Updated:** ${note.updatedAt.toISOString()}\n\n`
      markdown += `---\n\n`
      markdown += note.content

      // Add images section if any
      if (note.images.length > 0) {
        markdown += `\n\n## Images\n\n`
        for (const image of note.images) {
          markdown += `![Image](./images/${image.path})\n`
          markdown += `*${image.mime} • ${image.sizeBytes} bytes`
          if (image.width && image.height) {
            markdown += ` • ${image.width}×${image.height}`
          }
          markdown += `*\n\n`
        }

        // Copy image files
        const imagesDir = path.join(noteDir, "images")
        await mkdir(imagesDir, { recursive: true })

        for (const image of note.images) {
          const sourcePath = path.join(process.cwd(), "data", "uploads", image.path)
          const destPath = path.join(imagesDir, image.path)

          if (existsSync(sourcePath)) {
            await copyFile(sourcePath, destPath)
          } else {
            console.warn(`⚠️  Image file not found: ${image.path}`)
          }
        }
      }

      // Write markdown file
      const markdownPath = path.join(noteDir, `${note.slug}.md`)
      await writeFile(markdownPath, markdown, "utf-8")
    }

    // Create index file
    let indexContent = `# Notes Export\n\n`
    indexContent += `**Export Date:** ${new Date().toISOString()}\n`
    indexContent += `**Total Notes:** ${notes.length}\n\n`
    indexContent += `## Notes\n\n`

    for (const note of notes) {
      indexContent += `- [${note.slug}](./${note.slug}/${note.slug}.md)`
      if (note.images.length > 0) {
        indexContent += ` (${note.images.length} images)`
      }
      indexContent += `\n`
    }

    await writeFile(path.join(exportDir, "README.md"), indexContent, "utf-8")

    console.log(`✅ Export completed successfully!`)
    console.log(`📁 Location: ${exportDir}`)
    console.log(`📊 Exported ${notes.length} notes`)
  } catch (error) {
    console.error("❌ Export failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run export if called directly
if (require.main === module) {
  exportNotes()
}

export { exportNotes }
