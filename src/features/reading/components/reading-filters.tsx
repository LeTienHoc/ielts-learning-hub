import Link from "next/link"

import {
  CONTENT_LEVELS,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/content/practice-set-schema"
import { cn } from "@/lib/utils"

import { filterHref, type ReadingFilters } from "../utils/filters"

type ReadingFilterNavProps = {
  filters: ReadingFilters
  /** Question types offered as filters (those used by published sets). */
  types: readonly QuestionType[]
}

function FilterLink({ href, isActive, label }: { href: string; isActive: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-body-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </Link>
  )
}

/** Library filters (READ-01) as links, so a filtered library can be shared and bookmarked. */
export function ReadingFilterNav({ filters, types }: ReadingFilterNavProps) {
  const hasFilters = Boolean(filters.type ?? filters.level)

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filter by question type">
        <ul className="flex flex-wrap gap-2">
          {types.map((type) => {
            const isActive = filters.type === type
            return (
              <li key={type}>
                <FilterLink
                  label={QUESTION_TYPE_LABELS[type]}
                  isActive={isActive}
                  href={filterHref(filters, { type: isActive ? undefined : type })}
                />
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Filter by level">
          <ul className="flex flex-wrap gap-2">
            {CONTENT_LEVELS.map((level) => {
              const isActive = filters.level === level
              return (
                <li key={level}>
                  <FilterLink
                    label={level}
                    isActive={isActive}
                    href={filterHref(filters, { level: isActive ? undefined : level })}
                  />
                </li>
              )
            })}
          </ul>
        </nav>
        {hasFilters && (
          <Link
            href={filterHref(filters, { clear: true })}
            className="text-body-sm text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Clear filters
          </Link>
        )}
      </div>
    </div>
  )
}
