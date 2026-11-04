import { Mic } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/speaking")

export default function SpeakingPage() {
  return (
    <RoutePage href="/speaking">
      <EmptyState
        icon={Mic}
        title="No speaking practice yet"
        description="Speaking Part 1, 2 and 3 practice sessions will appear here."
      />
    </RoutePage>
  )
}
