'use client'

import { useRouter } from 'next/navigation'
import { NoteLogin } from '@/components/note-login'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useNote, type EditableNote } from '@/hooks/use-note'
import { useNoteSync } from '@/hooks/use-note-sync'
import { useSaveShortcut } from '@/hooks/use-save-shortcut'
import { NoteHeader } from './_components/note-header'
import { NoteFooter } from './_components/note-footer'
import { NoteSkeleton } from './_components/note-skeleton'

interface NoteClientProps {
  slug: string
}

export function NoteClient({ slug }: NoteClientProps) {
  const {
    note,
    setNote,
    secret,
    isLoading,
    needsAuth,
    authError,
    authenticate,
    markAuthLost,
  } = useNote(slug)

  if (needsAuth) {
    return (
      <NoteLogin
        slug={slug}
        onAuth={authenticate}
        isLoading={isLoading}
        error={authError}
      />
    )
  }

  if (isLoading) return <NoteSkeleton />

  if (!note) return null

  return (
    <NoteWorkspace
      key={note.id}
      slug={slug}
      secret={secret}
      note={note}
      setNote={setNote}
      onAuthLost={markAuthLost}
    />
  )
}

interface NoteWorkspaceProps {
  slug: string
  secret: string
  note: EditableNote
  setNote: Parameters<typeof useNoteSync>[0]['setNote']
  onAuthLost: (message: string) => void
}

function NoteWorkspace({
  slug,
  secret,
  note,
  setNote,
  onAuthLost,
}: NoteWorkspaceProps) {
  const router = useRouter()
  const sync = useNoteSync({ slug, secret, note, setNote, onAuthLost })

  useSaveShortcut(sync.save)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-in fade-in duration-500">
      <NoteHeader
        slug={note.slug}
        isRealtimeConnected={sync.isRealtimeConnected}
        hasUnsavedChanges={sync.hasUnsavedChanges}
        isSaving={sync.isSaving}
        isUpdatingFromRemote={sync.isUpdatingFromRemote}
        lastSaved={sync.lastSaved}
        autosaveEnabled={sync.autosaveEnabled}
        onAutosaveChange={sync.setAutosaveEnabled}
        onSave={sync.save}
        onHome={() => router.push('/')}
      />

      <main className="max-w-4xl mx-auto p-4">
        <section
          className="bg-background/95 backdrop-blur border border-border/50 rounded-lg shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200"
          aria-label="Note editor"
        >
          <RichTextEditor
            content={sync.content}
            onUpdate={sync.changeContent}
            placeholder="Start writing your note..."
            slug={slug}
            secret={secret}
            className=""
          />
        </section>

        <NoteFooter createdAt={note.createdAt} updatedAt={note.updatedAt} />
      </main>
    </div>
  )
}
