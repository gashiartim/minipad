import { prisma } from "./db"
import { ensureUploadsDir } from "./server-utils"

export async function initializeApp() {
  try {
    await ensureUploadsDir()

    await prisma.$connect()
    console.log("✅ Database connected successfully")

    console.log("✅ Application initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize application:", error)
    process.exit(1)
  }
}
