"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeNoteSocket } from "@/hooks/use-realtime-note-socket"
import { NoteLogin } from "@/components/note-login"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Save, Home, Clock, Calendar } from "lucide-react"

interface Note {
  id: string
  slug: string
  content: string
  contentRich: string
  contentFormat: "rich"
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

interface NoteClientProps {
  slug: string
}

export function NoteClient({ slug }: NoteClientProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [contentRich, setContentRich] = useState("")
  const [secret, setSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState("")
  const [needsAuth, setNeedsAuth] = useState(false)
  const [isUpdatingFromRemote, setIsUpdatingFromRemote] = useState(false)
  const [isUpdatingLocally, setIsUpdatingLocally] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Real-time synchronization
  const { isConnected: isRealtimeConnected } = useRealtimeNoteSocket({
    slug,
    secret,
    enabled: isAuthenticated,
    onUpdate: useCallback((update) => {
      if (update.type === "content_update") {
        // Check for conflicts: if user has unsaved changes when remote update arrives
        const updateContent = update.contentRich || ""
        
        // Only prevent updates if there are unsaved changes AND the content is significantly different
        // Allow updates if we're currently making local changes (formatting buttons) or saving
        if (hasUnsavedChanges && contentRich !== updateContent && !isSaving && !isUpdatingLocally) {
          // Additional check: if the update seems to be our own change (same base content), allow it
          const strippedLocal = contentRich.replace(/<[^>]*>/g, '').trim()
          const strippedUpdate = updateContent.replace(/<[^>]*>/g, '').trim()
          
          if (strippedLocal !== strippedUpdate) {
            toast({
              title: "Content updated by another user",
              description: "Your changes will be preserved. Save to overwrite or refresh to discard.",
              variant: "default",
            })
            return // Don't overwrite local changes
          }
        }
        
        setIsUpdatingFromRemote(true)
        
        // Update rich content
        if (update.contentRich !== undefined) {
          setContentRich(update.contentRich)
        }
        
        setNote((prev) => prev ? { 
          ...prev, 
          content: update.content || prev.content,
          contentRich: update.contentRich || prev.contentRich,
          contentFormat: "rich", // Always use rich format now
          updatedAt: update.updatedAt || prev.updatedAt 
        } : null)
        setHasUnsavedChanges(false)
        setTimeout(() => setIsUpdatingFromRemote(false), 500)
      }
    }, [hasUnsavedChanges, contentRich, toast, isSaving, isUpdatingLocally])
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
      setNote({
        ...noteData,
        contentRich: noteData.contentRich || (noteData.content ? `<p>${noteData.content.replace(/\n/g, '</p><p>')}</p>` : ""),
        contentFormat: "rich"
      })
      setContentRich(noteData.contentRich || (noteData.content ? `<p>${noteData.content.replace(/\n/g, '</p><p>')}</p>` : ""))
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
    const contentRichToSave = contentRich
    
    setIsSaving(true)
    // Optimistic update
    setHasUnsavedChanges(false)
    setLastSaved(new Date())
    
    try {
      const requestBody: any = {
        secret: secret || undefined,
        contentRich: contentRichToSave,
        contentFormat: "rich",
        // Also save plain text version for fallback (strip HTML)
        content: contentRichToSave.replace(/<[^>]*>/g, '')
      }
      
      const response = await fetch(`/api/notes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update on error
        setHasUnsavedChanges(contentRich !== note.contentRich)
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
        content: contentRichToSave.replace(/<[^>]*>/g, ''),
        contentRich: contentRichToSave,
        contentFormat: "rich",
        updatedAt: data.updatedAt 
      } : null))
      
      // Only show success toast if we're not in the middle of real-time updates
      if (!isUpdatingFromRemote) {
        toast({
          title: "Saved",
          description: "Note saved successfully",
        })
      }
    } catch (error) {
      // Revert optimistic update
      setHasUnsavedChanges(contentRich !== note.contentRich)
      setLastSaved(null)
      
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [note, contentRich, secret, slug, toast, isSaving, isAuthenticated, isUpdatingFromRemote])

  // Auto-save with debounce
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !note) return

    const timer = setTimeout(() => {
      saveNote()
    }, 1500)

    return () => clearTimeout(timer)
  }, [contentRich, hasUnsavedChanges, autosaveEnabled, saveNote, note])

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

  const handleRichContentChange = (value: string) => {
    // Don't mark as unsaved if this is from a remote update
    if (isUpdatingFromRemote) return
    
    setIsUpdatingLocally(true)
    setContentRich(value)
    setHasUnsavedChanges(true)
    
    // Clear the local update flag after a brief delay
    setTimeout(() => setIsUpdatingLocally(false), 100)
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-in fade-in duration-500">
        {/* Loading header */}
        <div className="border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-32 animate-pulse" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-12 animate-pulse" />
                  <Skeleton className="h-3 w-16 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20 animate-pulse" />
                <Skeleton className="h-8 w-16 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading content */}
        <main className="max-w-4xl mx-auto p-4">
          <div className="bg-background/95 backdrop-blur border border-border/50 rounded-lg shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="p-6 space-y-4">
              <Skeleton className="h-64 w-full animate-pulse" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 flex-1 animate-pulse" />
                <Skeleton className="h-10 w-20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading footer */}
          <div className="mt-6 animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <Skeleton className="h-12 w-full rounded-lg animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (!note) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-in fade-in duration-500">
      {/* Header with note title and controls */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10 animate-in slide-in-from-top-4 duration-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-mono text-xl font-semibold text-balance">{note.slug}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span>{isRealtimeConnected ? 'Live' : 'Offline'}</span>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-orange-600">Unsaved</span>
                  </div>
                )}
                {isSaving && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-blue-600">Saving...</span>
                  </div>
                )}
                {isUpdatingFromRemote && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600">Syncing</span>
                  </div>
                )}
                {lastSaved && (
                  <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(e) => setAutosaveEnabled(e.target.checked)}
                  className="rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  id="autosave"
                  aria-describedby="autosave-description"
                />
                <label htmlFor="autosave" className="text-muted-foreground cursor-pointer">Auto-save</label>
                <span id="autosave-description" className="sr-only">
                  Automatically save changes after 1.5 seconds of inactivity
                </span>
              </div>
              
              <Button 
                onClick={saveNote} 
                disabled={isSaving} 
                size="sm" 
                className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={isSaving ? "Saving note..." : "Save note manually"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              
              <Button 
                onClick={() => router.push("/")} 
                variant="outline" 
                size="sm" 
                className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Go to homepage"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="max-w-4xl mx-auto p-4">
        <section className="bg-background/95 backdrop-blur border border-border/50 rounded-lg shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200" aria-label="Note editor">
          <RichTextEditor
            content={contentRich}
            onUpdate={handleRichContentChange}
            placeholder="Start writing your note..."
            slug={slug}
            secret={secret}
            className=""
          />
        </section>

        {/* Metadata and image gallery */}
        <footer className="mt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <div 
            className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 backdrop-blur rounded-lg px-4 py-3 border border-border/30 transition-colors hover:bg-background/70"
            role="contentinfo"
            aria-label="Note metadata and shortcuts"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>Created <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleDateString()}</time></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>Updated <time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleDateString()}</time></span>
              </div>
            </div>
            <div className="text-muted-foreground/70" role="note" aria-label="Keyboard shortcuts and tips">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted/50 rounded">⌘S</kbd> to save • Auto-save after 1.5s • Paste images directly
            </div>
          </div>

        </footer>
      </main>
    </div>
  )
}