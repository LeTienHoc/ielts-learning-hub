import { Route } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/learning")

export default function LearningPage() {
  return (
    <RoutePage href="/learning">
      <EmptyState
        icon={Route}
        title="No roadmap yet"
        description="Your personalised learning roadmap will be generated from your level and target band."
      />
    </RoutePage>
  )
}
