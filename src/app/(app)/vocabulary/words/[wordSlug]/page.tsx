import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { WordDetail } from "@/features/vocabulary"

export const metadata: Metadata = { title: "Word" }

export default function WordPage({ params }: PageProps<"/vocabulary/words/[wordSlug]">) {
  return (
    <Suspense
      fallback={<Skeleton className="h-96 w-full max-w-3xl rounded-card" aria-label="Loading" />}
    >
      <WordDetail params={params} />
    </Suspense>
  )
}
