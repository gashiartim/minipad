"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeNote } from "@/hooks/use-realtime-note"
import { ImageUpload } from "@/components/image-upload"
import { ImageGallery } from "@/components/image-gallery"
import { NoteLogin } from "@/components/note-login"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Save, Home, Clock, Calendar, ImageIcon, Type, FileText } from "lucide-react"

interface Note {
  id: string
  slug: string
  content: string
  contentRich?: string
  contentFormat: "plain" | "rich"
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
  const [contentRich, setContentRich] = useState("")
  const [contentFormat, setContentFormat] = useState<"plain" | "rich">("plain")
  const [secret, setSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState("")
  const [needsAuth, setNeedsAuth] = useState(false)
  const [localContent, setLocalContent] = useState("")
  const [isUpdatingFromRemote, setIsUpdatingFromRemote] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Real-time synchronization
  const { isConnected: isRealtimeConnected } = useRealtimeNote({
    slug,
    secret,
    enabled: isAuthenticated,
    onUpdate: useCallback((update) => {
      if (update.type === "content_update") {
        // Check for conflicts: if user has unsaved changes when remote update arrives
        const currentContent = contentFormat === "rich" ? contentRich : content
        const updateContent = update.contentFormat === "rich" ? update.contentRich : update.content
        
        if (hasUnsavedChanges && currentContent !== updateContent) {
          toast({
            title: "Content updated by another user",
            description: "Your changes will be preserved. Save to overwrite or refresh to discard.",
            variant: "default",
          })
          return // Don't overwrite local changes
        }
        
        setIsUpdatingFromRemote(true)
        
        // Update content based on format
        if (update.contentFormat === "rich" && update.contentRich !== undefined) {
          setContentRich(update.contentRich)
          setContentFormat("rich")
        }
        if (update.content !== undefined) {
          setContent(update.content)
          setLocalContent(update.content)
        }
        if (update.contentFormat !== undefined) {
          setContentFormat(update.contentFormat)
        }
        
        setNote((prev) => prev ? { 
          ...prev, 
          content: update.content || prev.content,
          contentRich: update.contentRich || prev.contentRich,
          contentFormat: update.contentFormat || prev.contentFormat,
          updatedAt: update.updatedAt || prev.updatedAt 
        } : null)
        setHasUnsavedChanges(false)
        setTimeout(() => setIsUpdatingFromRemote(false), 500)
      }
    }, [hasUnsavedChanges, content, contentRich, contentFormat, toast])
  })

  const fetchNote = useCallback(async (providedSecret?: string) => {
    try {
      const url = new URL(`/api/notes/${slug}`, window.location.origin)
      if (providedSecret) {
        url.searchParams.set("secret", providedSecret)
      }
      
      const response = await fetch(url.toString())

      if (response.status === 404) {
        toast({
          title: "Note not found",
          description: "This note doesn't exist yet.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      if (response.status === 401) {
        setNeedsAuth(true)
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch note")
      }

      const noteData = await response.json()
      setNote(noteData)
      setContent(noteData.content)
      setContentRich(noteData.contentRich || "")
      setContentFormat(noteData.contentFormat || "plain")
      setLocalContent(noteData.content)
      setIsAuthenticated(true)
      setNeedsAuth(false)
      setAuthError("")
      
      if (providedSecret) {
        setSecret(providedSecret)
      }
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

  const handleAuth = useCallback(async (providedSecret: string) => {
    setAuthError("")
    setIsLoading(true)
    
    try {
      await fetchNote(providedSecret)
    } catch (error) {
      setAuthError("Invalid secret. Please try again.")
      setIsLoading(false)
    }
  }, [fetchNote])

  const saveNote = useCallback(async () => {
    if (!note || isSaving || !isAuthenticated) return

    // Capture current content for optimistic update
    const contentToSave = content
    const contentRichToSave = contentRich
    const contentFormatToSave = contentFormat
    
    setIsSaving(true)
    // Optimistic update
    setHasUnsavedChanges(false)
    setLastSaved(new Date())
    
    try {
      const requestBody: any = {
        secret: secret || undefined,
      }
      
      if (contentFormatToSave === "rich") {
        requestBody.contentRich = contentRichToSave
        requestBody.contentFormat = "rich"
        // Also save plain text version for fallback
        requestBody.content = contentToSave
      } else {
        requestBody.content = contentToSave
        requestBody.contentFormat = "plain"
      }
      
      const response = await fetch(`/api/notes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update on error
        setHasUnsavedChanges(content !== note.content)
        setLastSaved(null)
        
        // If authentication fails, show login screen again
        if (response.status === 403) {
          setIsAuthenticated(false)
          setNeedsAuth(true)
          setAuthError("Secret expired or invalid. Please re-authenticate.")
          return
        }
        
        toast({
          title: "Error",
          description: data.error || "Failed to save note",
          variant: "destructive",
        })
        return
      }

      // Update with server response
      setNote((prev) => (prev ? { 
        ...prev, 
        content: contentToSave,
        contentRich: contentRichToSave,
        contentFormat: contentFormatToSave,
        updatedAt: data.updatedAt 
      } : null))
      setLocalContent(contentToSave)
      
      // Only show success toast if we're not in the middle of real-time updates
      if (!isUpdatingFromRemote) {
        toast({
          title: "Saved",
          description: "Note saved successfully",
        })
      }
    } catch (error) {
      // Revert optimistic update
      setHasUnsavedChanges(content !== note.content)
      setLastSaved(null)
      
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [note, content, contentRich, contentFormat, secret, slug, toast, isSaving, isAuthenticated, isUpdatingFromRemote])

  // Auto-save with debounce
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !note) return

    const timer = setTimeout(() => {
      saveNote()
    }, 1500)

    return () => clearTimeout(timer)
  }, [content, contentRich, hasUnsavedChanges, autosaveEnabled, saveNote, note])

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
    // Don't mark as unsaved if this is from a remote update
    if (isUpdatingFromRemote) return
    
    setContent(value)
    setLocalContent(value)
    setHasUnsavedChanges(true)
  }

  const handleRichContentChange = (value: string) => {
    // Don't mark as unsaved if this is from a remote update
    if (isUpdatingFromRemote) return
    
    setContentRich(value)
    setContentFormat("rich")
    setHasUnsavedChanges(true)
  }

  const switchToRichEditor = () => {
    setContentFormat("rich")
    // Convert plain text to basic HTML if needed
    if (!contentRich && content) {
      setContentRich(`<p>${content.replace(/\n/g, '</p><p>')}</p>`)
    }
  }

  const switchToPlainEditor = () => {
    setContentFormat("plain")
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

  // Show login screen if authentication is needed
  if (needsAuth && !isAuthenticated) {
    return (
      <NoteLogin 
        slug={slug}
        onAuth={handleAuth}
        isLoading={isLoading}
        error={authError}
      />
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
                <div className="flex items-center gap-2">
                  <Button
                    variant={contentFormat === "plain" ? "default" : "outline"}
                    size="sm"
                    onClick={switchToPlainEditor}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Plain
                  </Button>
                  <Button
                    variant={contentFormat === "rich" ? "default" : "outline"}
                    size="sm"
                    onClick={switchToRichEditor}
                  >
                    <Type className="h-4 w-4 mr-1" />
                    Rich
                  </Button>
                </div>
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
                {isUpdatingFromRemote && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-500">Sync update</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isRealtimeConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentFormat === "rich" ? (
              <RichTextEditor
                content={contentRich}
                onUpdate={handleRichContentChange}
                placeholder="Start writing your note..."
                slug={slug}
                secret={secret}
                className="min-h-[300px]"
              />
            ) : (
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing your note..."
                className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
              />
            )}

            <div className="flex justify-end">
              <Button onClick={saveNote} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-pretty">
              Press Ctrl/Cmd+S to save • Auto-save after 1.5s of inactivity
              {contentFormat === "rich" && " • Paste images directly in rich editor"}
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
