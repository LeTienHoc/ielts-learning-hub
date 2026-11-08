import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { ReadingReview } from "@/features/reading"

export const metadata: Metadata = { title: "Reading results" }

export default function ReadingReviewPage({
  params,
}: PageProps<"/reading/[setSlug]/attempt/[attemptId]/review">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <ReadingReview params={params} />
    </Suspense>
  )
}
