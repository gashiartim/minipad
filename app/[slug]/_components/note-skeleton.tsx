import { Skeleton } from '@/components/ui/skeleton'

export function NoteSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-in fade-in duration-500">
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

        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <Skeleton className="h-12 w-full rounded-lg animate-pulse" />
        </div>
      </main>
    </div>
  )
}
