import { Calendar, Clock } from 'lucide-react'

interface NoteFooterProps {
  createdAt: string
  updatedAt: string
}

export function NoteFooter({ createdAt, updatedAt }: NoteFooterProps) {
  return (
    <footer className="mt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-500">
      <div
        className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 backdrop-blur rounded-lg px-4 py-3 border border-border/30 transition-colors hover:bg-background/70"
        role="contentinfo"
        aria-label="Note metadata and shortcuts"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>
              Created{' '}
              <time dateTime={createdAt}>
                {new Date(createdAt).toLocaleDateString()}
              </time>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>
              Updated{' '}
              <time dateTime={updatedAt}>
                {new Date(updatedAt).toLocaleDateString()}
              </time>
            </span>
          </div>
        </div>
        <div
          className="text-muted-foreground/70"
          role="note"
          aria-label="Keyboard shortcuts and tips"
        >
          Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted/50 rounded">⌘S</kbd> to
          save • Auto-save after 1.5s • Paste images directly
        </div>
      </div>
    </footer>
  )
}
