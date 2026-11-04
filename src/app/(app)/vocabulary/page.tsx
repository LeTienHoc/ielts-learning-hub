import { BookA } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/vocabulary")

export default function VocabularyPage() {
  return (
    <RoutePage href="/vocabulary">
      <EmptyState
        icon={BookA}
        title="No vocabulary yet"
        description="Words and phrases you study will be collected here for review."
      />
    </RoutePage>
  )
}
