import { BookOpenText } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { QUESTION_TYPES } from "@/lib/content/practice-set-schema"
import { listPublishedPracticeSets } from "@/server/practice/practice-service"

import { filterReadingSets, parseReadingFilters } from "../utils/filters"
import { ReadingFilterNav } from "./reading-filters"
import { ReadingSetList } from "./reading-set-list"

type ReadingLibraryProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Published Reading sets with filters from the URL (READ-01).
 * Reads the session and search params: render inside <Suspense>.
 */
export async function ReadingLibrary({ searchParams }: ReadingLibraryProps) {
  const [sets, params] = await Promise.all([listPublishedPracticeSets("reading"), searchParams])

  if (sets.length === 0) {
    return (
      <EmptyState
        icon={BookOpenText}
        title="No reading practice yet"
        description="Reading passages and question sets will appear here once they are published."
      />
    )
  }

  const filters = parseReadingFilters(params)
  const usedTypes = new Set(sets.flatMap((set) => set.questionTypes))

  return (
    <div className="flex flex-col gap-6">
      <ReadingFilterNav
        filters={filters}
        types={QUESTION_TYPES.filter((type) => usedTypes.has(type))}
      />
      <ReadingSetList sets={filterReadingSets(sets, filters)} />
    </div>
  )
}
