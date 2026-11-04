import { LayoutDashboard } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { RoutePage, routeMetadata } from "@/components/layout/route-page"

export const metadata = routeMetadata("/dashboard")

export default function DashboardPage() {
  return (
    <RoutePage href="/dashboard">
      <EmptyState
        icon={LayoutDashboard}
        title="Your dashboard is ready"
        description="Once you start learning, your lessons, practice activity and next steps will appear here."
      />
    </RoutePage>
  )
}
