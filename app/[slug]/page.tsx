import { use } from "react"
import { NoteClient } from "./note-client"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  
  return {
    title: `${slug} - Minipad`,
    description: `Edit and collaborate on the "${slug}" note with Minipad. Real-time sync, rich text editing, and secure note sharing.`,
    openGraph: {
      title: `${slug} - Minipad Note`,
      description: `Collaborate on the "${slug}" note with real-time sync and rich text editing.`,
      url: `https://minipad.app/${slug}`,
      siteName: "Minipad",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${slug} - Minipad Note`,
      description: `Edit and collaborate on the "${slug}" note with Minipad.`,
    },
    alternates: {
      canonical: `/${slug}`,
    },
  }
}

export default function NotePage({ params }: PageProps) {
  const { slug } = use(params)
  
  return <NoteClient slug={slug} />
}