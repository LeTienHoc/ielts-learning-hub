import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { GrammarResults } from "@/features/grammar"

export const metadata: Metadata = { title: "Grammar results" }

export default function GrammarResultsPage({
  params,
}: PageProps<"/grammar/[topicSlug]/practice/[attemptId]/review">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <GrammarResults params={params} />
    </Suspense>
  )
}
