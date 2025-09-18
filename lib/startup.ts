import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "./db"

export async function initializeApp() {
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), "data")
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(dataDir, "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Test database connection
    await prisma.$connect()
    console.log("✅ Database connected successfully")

    // Run any pending migrations
    // In production, you'd run: prisma migrate deploy
    // For development with SQLite, we'll use db push
    console.log("✅ Application initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize application:", error)
    process.exit(1)
  }
}
