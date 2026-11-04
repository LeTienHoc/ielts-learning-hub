import { PenLine } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/writing")

export default function WritingPage() {
  return (
    <RoutePage href="/writing">
      <EmptyState
        icon={PenLine}
        title="No writing practice yet"
        description="Writing Task 1 and Task 2 prompts and your submissions will appear here."
      />
    </RoutePage>
  )
}
