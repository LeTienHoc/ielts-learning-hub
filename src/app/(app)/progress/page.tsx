import { ChartLine } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/progress")

export default function ProgressPage() {
  return (
    <RoutePage href="/progress">
      <EmptyState
        icon={ChartLine}
        title="No progress data yet"
        description="Your learning activity and progress over time will be tracked here once you start practising."
      />
    </RoutePage>
  )
}
