import { Bot } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/ai-tutor")

export default function AiTutorPage() {
  return (
    <RoutePage href="/ai-tutor">
      <EmptyState
        icon={Bot}
        title="AI Tutor is not available yet"
        description="Your personal AI tutor for English and IELTS is coming in a future release."
      />
    </RoutePage>
  )
}
