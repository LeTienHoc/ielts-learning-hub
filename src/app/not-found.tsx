import { Compass } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { HOME_ROUTE } from "@/config/navigation"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-surface p-4">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        className="w-full max-w-lg"
        action={
          <Button asChild>
            <Link href={HOME_ROUTE}>Go to dashboard</Link>
          </Button>
        }
      />
    </main>
  )
}
