"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { ImageGallery } from "@/components/image-gallery"
import { Save, Home, Clock, Calendar, ImageIcon } from "lucide-react"

interface Note {
  id: string
  slug: string
  content: string
  createdAt: string
  updatedAt: string
  images: Array<{
    id: string
    path: string
    mime: string
    width: number | null
    height: number | null
    sizeBytes: number
    createdAt: string
  }>
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function NotePage({ params }: PageProps) {
  const { slug } = use(params)
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [secret, setSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchNote = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${slug}`)

      if (response.status === 404) {
        toast({
          title: "Note not found",
          description: "This note doesn't exist yet.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch note")
      }

      const noteData = await response.json()
      setNote(noteData)
      setContent(noteData.content)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [slug, router, toast])

  const saveNote = useCallback(async () => {
    if (!note || isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/notes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          secret: secret || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to save note",
          variant: "destructive",
        })
        return
      }

      setNote((prev) => (prev ? { ...prev, content, updatedAt: data.updatedAt } : null))
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      toast({
        title: "Saved",
        description: "Note saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [note, content, secret, slug, toast, isSaving])

  // Auto-save with debounce
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !note) return

    const timer = setTimeout(() => {
      saveNote()
    }, 1500)

    return () => clearTimeout(timer)
  }, [content, hasUnsavedChanges, autosaveEnabled, saveNote, note])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        saveNote()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [saveNote])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  const handleContentChange = (value: string) => {
    setContent(value)
    setHasUnsavedChanges(true)
  }

  const handleImageUploaded = (image: any) => {
    setNote((prev) =>
      prev
        ? {
            ...prev,
            images: [...prev.images, image],
          }
        : null,
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!note) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="font-mono text-lg text-balance">{note.slug}</span>
              <Button onClick={() => router.push("/")} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Updated: {new Date(note.updatedAt).toLocaleString()}</span>
                {lastSaved && (
                  <span className="text-green-600 ml-2">(Last saved: {lastSaved.toLocaleTimeString()})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Images: {note.images.length}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Content</CardTitle>
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autosaveEnabled}
                    onChange={(e) => setAutosaveEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-save
                </Label>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-xs text-orange-500">Unsaved changes</span>
                  </div>
                )}
                {isSaving && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-500">Saving...</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your note..."
              className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
            />

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="secret" className="text-sm">
                  Secret (if note is protected)
                </Label>
                <Input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret to save"
                  className="mt-1"
                />
              </div>
              <Button onClick={saveNote} disabled={isSaving} className="mt-6">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-pretty">
              Press Ctrl/Cmd+S to save • Auto-save after 1.5s of inactivity
            </p>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <ImageUpload slug={note.slug} secret={secret} onImageUploaded={handleImageUploaded} />

        {/* Image Gallery */}
        {note.images.length > 0 && <ImageGallery images={note.images} />}
      </div>
    </div>
  )
}
