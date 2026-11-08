import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { LocalDateTime } from "@/components/shared/local-date-time"
import { Badge } from "@/components/ui/badge"
import type { ReadingHistoryItem } from "@/features/practice"

import { readingReviewHref } from "../routes"

type ReadingHistoryListProps = {
  items: readonly ReadingHistoryItem[]
  /** Hide the set title (inside a set's own page). */
  hideTitle?: boolean
}

/** Submitted Reading attempts, newest first, each linking to its results (READ-07). */
export function ReadingHistoryList({ items, hideTitle = false }: ReadingHistoryListProps) {
  return (
    <ul aria-label="Reading attempts" className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.attemptId}>
          <Link
            href={readingReviewHref(item.setSlug, item.attemptId)}
            className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              {!hideTitle && (
                <span className="truncate text-label text-foreground">{item.setTitle}</span>
              )}
              <span className="flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                {/* The separator stays with the date so it never starts a wrapped line. */}
                <span>
                  <LocalDateTime value={item.submittedAt} /> <span aria-hidden="true">·</span>
                </span>
                <span>{item.mode === "test" ? "Test mode" : "Learn mode"}</span>
              </span>
            </span>
            {item.band !== null ? (
              <Badge>Estimated band {item.band}</Badge>
            ) : (
              <span className="text-label text-foreground">
                {item.score} / {item.maxScore}
              </span>
            )}
            <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
