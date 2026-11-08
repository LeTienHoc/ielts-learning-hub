import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { ReadingSetIntro } from "@/features/reading"

export const metadata: Metadata = { title: "Reading practice" }

export default function ReadingSetPage({ params }: PageProps<"/reading/[setSlug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <ReadingSetIntro params={params} />
    </Suspense>
  )
}
