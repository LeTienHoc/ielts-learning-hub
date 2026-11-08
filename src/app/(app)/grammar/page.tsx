import { Suspense } from "react"

import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { Skeleton } from "@/components/ui/skeleton"
import { GrammarCatalogue } from "@/features/grammar"

export const metadata = routeMetadata("/grammar")

export default function GrammarPage() {
  return (
    <RoutePage href="/grammar">
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2" aria-label="Loading grammar topics">
            <Skeleton className="h-32 rounded-card" />
            <Skeleton className="h-32 rounded-card" />
          </div>
        }
      >
        <GrammarCatalogue />
      </Suspense>
    </RoutePage>
  )
}
