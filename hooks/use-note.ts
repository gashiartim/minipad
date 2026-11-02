'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { notesApi, type NoteDto } from '@/lib/api-client'
import { toRichContent } from '@/lib/note-content'

export type EditableNote = Omit<NoteDto, 'contentRich' | 'contentFormat'> & {
  contentRich: string
  contentFormat: 'rich'
}

const INVALID_SECRET_MESSAGE = 'Invalid secret. Please try again.'

function toEditableNote(dto: NoteDto): EditableNote {
  return { ...dto, contentRich: toRichContent(dto), contentFormat: 'rich' }
}

export function useNote(slug: string) {
  const [note, setNote] = useState<EditableNote | null>(null)
  const [secret, setSecret] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [authError, setAuthError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const load = useCallback(
    async (providedSecret?: string) => {
      const result = await notesApi.get(slug, providedSecret)
      setIsLoading(false)

      if (!result.ok) {
        if (result.status === 404) {
          toast({
            title: 'Note not found',
            description: "This note doesn't exist yet.",
            variant: 'destructive',
          })
          router.push('/')
        } else if (result.status === 401) {
          setNeedsAuth(true)
          if (providedSecret) setAuthError(INVALID_SECRET_MESSAGE)
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load note',
            variant: 'destructive',
          })
        }
        return
      }

      setNote(toEditableNote(result.data))
      setNeedsAuth(false)
      setAuthError('')
      if (providedSecret) setSecret(providedSecret)
    },
    [slug, router, toast]
  )

  const authenticate = useCallback(
    async (providedSecret: string) => {
      setAuthError('')
      setIsLoading(true)
      await load(providedSecret)
    },
    [load]
  )

  const markAuthLost = useCallback((message: string) => {
    setNeedsAuth(true)
    setAuthError(message)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    note,
    setNote,
    secret,
    isLoading,
    needsAuth,
    authError,
    authenticate,
    markAuthLost,
  }
}
