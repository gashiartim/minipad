import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Minipad - Simple Online Notepad | Rich Text Editor with Real-time Sync",
  description: "Create and edit rich text notes online with Minipad. Features real-time collaboration, image uploads, password protection, and instant sync. Free minimalist notepad app.",
  keywords: "online notepad, rich text editor, note taking app, collaborative notes, real-time sync, password protected notes, minimalist notepad, text editor online",
  authors: [{ name: "Minipad" }],
  creator: "Minipad",
  publisher: "Minipad",
  robots: "index, follow",
  generator: 'Next.js',
  applicationName: "Minipad",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL("https://minipad.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://minipad.app",
    siteName: "Minipad",
    title: "Minipad - Simple Online Notepad with Real-time Sync",
    description: "Create and edit rich text notes online with real-time collaboration, image uploads, and password protection. Free minimalist notepad app.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Minipad - Online Notepad App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minipad - Simple Online Notepad",
    description: "Create and edit rich text notes online with real-time collaboration and sync.",
    images: ["/og-image.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
