import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { GrammarTopic } from "@/features/grammar"

export const metadata: Metadata = { title: "Grammar lesson" }

export default function GrammarTopicPage({ params }: PageProps<"/grammar/[topicSlug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" aria-label="Loading" />}>
      <GrammarTopic params={params} />
    </Suspense>
  )
}
