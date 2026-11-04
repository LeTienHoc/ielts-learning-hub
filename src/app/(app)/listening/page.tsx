import { Headphones } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/listening")

export default function ListeningPage() {
  return (
    <RoutePage href="/listening">
      <EmptyState
        icon={Headphones}
        title="No listening practice yet"
        description="IELTS Listening sections with audio and questions will appear here."
      />
    </RoutePage>
  )
}
