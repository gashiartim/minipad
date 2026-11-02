'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  useRealtimeNoteSocket,
  type RealtimeNoteUpdate,
} from '@/hooks/use-realtime-note-socket'
import type { EditableNote } from '@/hooks/use-note'
import { notesApi } from '@/lib/api-client'
import { hasSameText, stripHtml } from '@/lib/note-content'
import { ERROR_MESSAGES, TIMING } from '@/lib/constants'

interface UseNoteSyncOptions {
  slug: string
  secret: string
  note: EditableNote
  setNote: Dispatch<SetStateAction<EditableNote | null>>
  onAuthLost: (message: string) => void
}

export function useNoteSync({
  slug,
  secret,
  note,
  setNote,
  onAuthLost,
}: UseNoteSyncOptions) {
  const [content, setContent] = useState(note.contentRich)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isUpdatingFromRemote, setIsUpdatingFromRemote] = useState(false)
  const [isUpdatingLocally, setIsUpdatingLocally] = useState(false)
  const { toast } = useToast()

  const latest = useRef({
    hasUnsavedChanges,
    content,
    isSaving,
    isUpdatingLocally,
  })
  useEffect(() => {
    latest.current = { hasUnsavedChanges, content, isSaving, isUpdatingLocally }
  }, [hasUnsavedChanges, content, isSaving, isUpdatingLocally])

  const applyRemoteUpdate = useCallback(
    (update: RealtimeNoteUpdate) => {
      if (update.type !== 'content_update') return

      const remoteContent = update.contentRich || ''
      const local = latest.current
      const hasLocalConflict =
        local.hasUnsavedChanges &&
        local.content !== remoteContent &&
        !local.isSaving &&
        !local.isUpdatingLocally &&
        !hasSameText(local.content, remoteContent)

      if (hasLocalConflict) {
        toast({
          title: 'Content updated by another user',
          description: ERROR_MESSAGES.CONTENT_SYNC_CONFLICT,
          variant: 'default',
        })
        return
      }

      setIsUpdatingFromRemote(true)
      if (update.contentRich !== undefined) setContent(update.contentRich)
      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: update.content || prev.content,
              contentRich: update.contentRich || prev.contentRich,
              updatedAt: update.updatedAt || prev.updatedAt,
            }
          : null
      )
      setHasUnsavedChanges(false)
      setTimeout(
        () => setIsUpdatingFromRemote(false),
        TIMING.SYNC_ANIMATION_DURATION
      )
    },
    [toast, setNote]
  )

  const { isConnected: isRealtimeConnected } = useRealtimeNoteSocket({
    slug,
    secret,
    enabled: true,
    onUpdate: applyRemoteUpdate,
  })

  const save = useCallback(async () => {
    if (isSaving) return

    const contentToSave = content
    const plainText = stripHtml(contentToSave)

    setIsSaving(true)
    setHasUnsavedChanges(false)
    setLastSaved(new Date())

    try {
      const result = await notesApi.update(slug, {
        secret: secret || undefined,
        contentRich: contentToSave,
        contentFormat: 'rich',
        content: plainText,
      })

      if (!result.ok) {
        setHasUnsavedChanges(contentToSave !== note.contentRich)
        setLastSaved(null)

        if (result.status === 403) {
          onAuthLost(ERROR_MESSAGES.AUTH_EXPIRED)
          return
        }

        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: plainText,
              contentRich: contentToSave,
              updatedAt: result.data.updatedAt,
            }
          : null
      )

      if (!isUpdatingFromRemote) {
        toast({ title: 'Saved', description: 'Note saved successfully' })
      }
    } finally {
      setIsSaving(false)
    }
  }, [
    content,
    isSaving,
    isUpdatingFromRemote,
    note.contentRich,
    onAuthLost,
    secret,
    setNote,
    slug,
    toast,
  ])

  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges) return

    const timer = setTimeout(save, TIMING.AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [content, hasUnsavedChanges, autosaveEnabled, save])

  const changeContent = useCallback(
    (value: string) => {
      if (isUpdatingFromRemote) return

      setIsUpdatingLocally(true)
      setContent(value)
      setHasUnsavedChanges(true)
      setTimeout(
        () => setIsUpdatingLocally(false),
        TIMING.LOCAL_UPDATE_CLEAR_DELAY
      )
    },
    [isUpdatingFromRemote]
  )

  return {
    content,
    changeContent,
    save,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    isUpdatingFromRemote,
    isRealtimeConnected,
    autosaveEnabled,
    setAutosaveEnabled,
  }
}
