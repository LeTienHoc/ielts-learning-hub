import { SpellCheck } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/grammar")

export default function GrammarPage() {
  return (
    <RoutePage href="/grammar">
      <EmptyState
        icon={SpellCheck}
        title="No grammar lessons yet"
        description="Grammar lessons with clear explanations and exercises will appear here."
      />
    </RoutePage>
  )
}
