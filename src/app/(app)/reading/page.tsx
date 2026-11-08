import { History } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ReadingLibrary } from "@/features/reading"

export const metadata = routeMetadata("/reading")

export default function ReadingPage({ searchParams }: PageProps<"/reading">) {
  return (
    <RoutePage
      href="/reading"
      actions={
        <Button asChild variant="outline">
          <Link href="/reading/history">
            <History aria-hidden="true" />
            History
          </Link>
        </Button>
      }
    >
      <Suspense
        fallback={
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading practice sets"
          >
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        }
      >
        <ReadingLibrary searchParams={searchParams} />
      </Suspense>
    </RoutePage>
  )
}
