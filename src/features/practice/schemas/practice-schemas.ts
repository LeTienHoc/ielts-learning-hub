import { z } from "zod"

export const attemptModeSchema = z.enum(["learn", "test"])

export const startAttemptSchema = z.object({
  practiceSetId: z.uuid(),
  mode: attemptModeSchema,
})
export type StartAttemptInput = z.infer<typeof startAttemptSchema>

/** One answer: selected option ids or a single text answer (the database re-checks the shape). */
export const answerResponseSchema = z.array(z.string().trim().min(1).max(200)).max(5)

export const saveAnswerSchema = z.object({
  attemptId: z.uuid(),
  questionId: z.uuid(),
  response: answerResponseSchema,
})
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>

export const attemptIdSchema = z.uuid()
