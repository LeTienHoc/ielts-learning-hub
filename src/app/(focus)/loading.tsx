import { Skeleton } from "@/components/ui/skeleton"

/** Focus-mode placeholder: top bar, passage and questions. */
export default function FocusLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-surface" aria-busy="true" aria-label="Loading">
      <div className="h-header border-b border-border bg-background" />
      <div className="mx-auto grid w-full max-w-content flex-1 gap-8 px-4 py-6 md:px-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    </div>
  )
}
