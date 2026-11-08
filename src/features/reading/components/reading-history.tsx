import { ArrowLeft, History } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { listReadingHistory } from "@/server/practice/reading-history"

import { ReadingHistoryList } from "./reading-history-list"

/** All submitted Reading attempts (READ-07). Reads the session: render inside <Suspense>. */
export async function ReadingHistory() {
  const items = await listReadingHistory()

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/reading">
            <ArrowLeft aria-hidden="true" />
            Reading
          </Link>
        </Button>
        <PageHeader
          title="Reading history"
          description="Your submitted attempts, newest first. Open one to review it."
        />
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No attempts yet"
          description="Finished reading attempts will appear here, with your score."
          action={
            <Button asChild>
              <Link href="/reading">Choose a reading set</Link>
            </Button>
          }
        />
      ) : (
        <div className="max-w-3xl rounded-card border border-border bg-background p-3">
          <ReadingHistoryList items={items} />
        </div>
      )}
    </div>
  )
}
