import { z } from "zod"

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(80)

/** URL params of Vocabulary routes. Invalid values are treated as "not found". */
export const vocabularySetParamsSchema = z.object({ setSlug: slugSchema })
export const wordParamsSchema = z.object({ wordSlug: slugSchema })

export const VOCABULARY_HREF = "/vocabulary"
export const VOCABULARY_SETS_HREF = "/vocabulary/sets"
export const VOCABULARY_REVIEW_HREF = "/vocabulary/review"
export const vocabularySetHref = (slug: string) => `${VOCABULARY_SETS_HREF}/${slug}`
export const wordHref = (slug: string) => `/vocabulary/words/${slug}`
