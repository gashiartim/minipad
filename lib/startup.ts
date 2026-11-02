import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "./db"

export async function initializeApp() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    const uploadsDir = path.join(dataDir, "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    await prisma.$connect()
    console.log("✅ Database connected successfully")

    console.log("✅ Application initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize application:", error)
    process.exit(1)
  }
}
