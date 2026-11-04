import { BookOpenText } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/reading")

export default function ReadingPage() {
  return (
    <RoutePage href="/reading">
      <EmptyState
        icon={BookOpenText}
        title="No reading practice yet"
        description="IELTS Reading passages and question sets will appear here."
      />
    </RoutePage>
  )
}
