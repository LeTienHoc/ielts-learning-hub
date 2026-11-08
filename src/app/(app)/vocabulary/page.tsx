import { Suspense } from "react"

import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { Skeleton } from "@/components/ui/skeleton"
import { VocabularyHome } from "@/features/vocabulary"

export const metadata = routeMetadata("/vocabulary")

export default function VocabularyPage() {
  return (
    <RoutePage href="/vocabulary">
      <Suspense
        fallback={<Skeleton className="h-48 w-full max-w-2xl rounded-card" aria-label="Loading" />}
      >
        <VocabularyHome />
      </Suspense>
    </RoutePage>
  )
}
