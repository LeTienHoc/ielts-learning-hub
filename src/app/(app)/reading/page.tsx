import { Suspense } from "react"

import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { Skeleton } from "@/components/ui/skeleton"
import { ReadingLibrary } from "@/features/reading"

export const metadata = routeMetadata("/reading")

export default function ReadingPage() {
  return (
    <RoutePage href="/reading">
      <Suspense
        fallback={
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading practice sets"
          >
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        }
      >
        <ReadingLibrary />
      </Suspense>
    </RoutePage>
  )
}
