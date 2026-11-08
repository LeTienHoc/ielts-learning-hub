import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SetCatalogue } from "@/features/vocabulary"

export const metadata: Metadata = { title: "Vocabulary sets" }

export default function VocabularySetsPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Vocabulary sets"
        description="Pick an IELTS topic to start learning its words."
      />
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-card" aria-label="Loading" />}>
        <SetCatalogue />
      </Suspense>
    </div>
  )
}
