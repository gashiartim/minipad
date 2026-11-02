import { Save, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoteHeaderProps {
  slug: string
  isRealtimeConnected: boolean
  hasUnsavedChanges: boolean
  isSaving: boolean
  isUpdatingFromRemote: boolean
  lastSaved: Date | null
  autosaveEnabled: boolean
  onAutosaveChange: (enabled: boolean) => void
  onSave: () => void
  onHome: () => void
}

export function NoteHeader({
  slug,
  isRealtimeConnected,
  hasUnsavedChanges,
  isSaving,
  isUpdatingFromRemote,
  lastSaved,
  autosaveEnabled,
  onAutosaveChange,
  onSave,
  onHome,
}: NoteHeaderProps) {
  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10 animate-in slide-in-from-top-4 duration-700">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono text-xl font-semibold text-balance">
              {slug}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                />
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
                <span className="text-green-600">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(e) => onAutosaveChange(e.target.checked)}
                className="rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
                id="autosave"
                aria-describedby="autosave-description"
              />
              <label
                htmlFor="autosave"
                className="text-muted-foreground cursor-pointer"
              >
                Auto-save
              </label>
              <span id="autosave-description" className="sr-only">
                Automatically save changes after 1.5 seconds of inactivity
              </span>
            </div>

            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isSaving ? 'Saving note...' : 'Save note manually'}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <Button
              onClick={onHome}
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
  )
}
