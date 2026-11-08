import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { ReadingHistory } from "@/features/reading"

export const metadata: Metadata = { title: "Reading history" }

export default function ReadingHistoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <ReadingHistory />
    </Suspense>
  )
}
