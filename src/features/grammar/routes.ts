import { z } from "zod"

/** URL params of Grammar routes. Invalid values are treated as "not found". */
export const grammarTopicParamsSchema = z.object({
  topicSlug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(60),
})
export const grammarAttemptParamsSchema = grammarTopicParamsSchema.extend({ attemptId: z.uuid() })

export const grammarTopicHref = (slug: string) => `/grammar/${slug}`
export const grammarPracticeHref = (slug: string) => `/grammar/${slug}/practice`
export const grammarAttemptHref = (slug: string, attemptId: string) =>
  `${grammarPracticeHref(slug)}/${attemptId}`
export const grammarResultsHref = (slug: string, attemptId: string) =>
  `${grammarAttemptHref(slug, attemptId)}/review`
