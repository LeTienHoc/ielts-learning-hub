import { z } from "zod"

/** URL params of Reading routes. Invalid values are treated as "not found". */
export const readingSetParamsSchema = z.object({
  setSlug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(80),
})
export const readingAttemptParamsSchema = readingSetParamsSchema.extend({ attemptId: z.uuid() })

export const readingSetHref = (slug: string) => `/reading/${slug}`
export const readingAttemptsHref = (slug: string) => `/reading/${slug}/attempt`
export const readingAttemptHref = (slug: string, attemptId: string) =>
  `${readingAttemptsHref(slug)}/${attemptId}`
export const readingReviewHref = (slug: string, attemptId: string) =>
  `${readingAttemptHref(slug, attemptId)}/review`
