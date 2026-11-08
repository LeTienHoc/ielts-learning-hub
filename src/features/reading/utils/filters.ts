import {
  CONTENT_LEVELS,
  QUESTION_TYPES,
  type ContentLevel,
  type QuestionType,
} from "@/lib/content/practice-set-schema"

export type ReadingFilters = { type?: QuestionType; level?: ContentLevel }

const single = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined

/** Library filters from URL search params (READ-01). Unknown values are ignored. */
export function parseReadingFilters(
  params: Readonly<Record<string, string | string[] | undefined>>,
): ReadingFilters {
  const type = QUESTION_TYPES.find((candidate) => candidate === single(params.type))
  const level = CONTENT_LEVELS.find((candidate) => candidate === single(params.level))
  return { ...(type ? { type } : {}), ...(level ? { level } : {}) }
}

export function filterReadingSets<
  T extends { questionTypes: readonly QuestionType[]; level: ContentLevel },
>(sets: readonly T[], filters: ReadingFilters): T[] {
  return sets.filter(
    (set) =>
      (!filters.type || set.questionTypes.includes(filters.type)) &&
      (!filters.level || set.level === filters.level),
  )
}

/** The library URL after changing (or clearing) filters. */
export function filterHref(
  current: ReadingFilters,
  change: Partial<ReadingFilters> & { clear?: boolean },
): string {
  if (change.clear) return "/reading"
  const next = { ...current, ...change }
  const query = new URLSearchParams()
  if (next.type) query.set("type", next.type)
  if (next.level) query.set("level", next.level)
  const search = query.toString()
  return search ? `/reading?${search}` : "/reading"
}
