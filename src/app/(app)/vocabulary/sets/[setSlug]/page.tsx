import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { SetDetail } from "@/features/vocabulary"

export const metadata: Metadata = { title: "Vocabulary set" }

export default function VocabularySetPage({ params }: PageProps<"/vocabulary/sets/[setSlug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <SetDetail params={params} />
    </Suspense>
  )
}
