"use server"

import { saveAnswer, startAttempt, submitAttempt } from "@/server/practice/practice-service"

import {
  attemptIdSchema,
  saveAnswerSchema,
  startAttemptSchema,
  type SaveAnswerInput,
  type StartAttemptInput,
} from "./schemas/practice-schemas"

const TRY_AGAIN = "Something went wrong. Please try again."

export type StartAttemptResult = { ok: true; attemptId: string } | { ok: false; error: string }

export async function startAttemptAction(input: StartAttemptInput): Promise<StartAttemptResult> {
  const parsed = startAttemptSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: TRY_AGAIN }

  const result = await startAttempt(parsed.data.practiceSetId, parsed.data.mode)
  if (result.ok) return { ok: true, attemptId: result.value }
  if (result.code === "set_not_found") {
    return { ok: false, error: "This practice set is no longer available." }
  }
  if (result.code === "test_mode_unavailable") {
    return { ok: false, error: "Test mode is not available for this set." }
  }
  return { ok: false, error: TRY_AGAIN }
}

/**
 * How the client should react to a failed save:
 * retry — temporary problem, keep the answer and try again;
 * expired / submitted — the attempt is closed, go to the results;
 * rejected — the answer or session is not valid, do not retry.
 */
export type SaveAnswerResult =
  { ok: true } | { ok: false; reason: "retry" | "expired" | "submitted" | "rejected" }

export async function saveAnswerAction(input: SaveAnswerInput): Promise<SaveAnswerResult> {
  const parsed = saveAnswerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: "rejected" }

  const { attemptId, questionId, response } = parsed.data
  const result = await saveAnswer(attemptId, questionId, response)
  if (result.ok) return { ok: true }

  switch (result.code) {
    case "attempt_expired":
      return { ok: false, reason: "expired" }
    case "attempt_submitted":
      return { ok: false, reason: "submitted" }
    case "failed":
      return { ok: false, reason: "retry" }
    default:
      return { ok: false, reason: "rejected" }
  }
}

export type SubmitAttemptResult = { ok: true } | { ok: false; error: string }

export async function submitAttemptAction(attemptId: string): Promise<SubmitAttemptResult> {
  const parsed = attemptIdSchema.safeParse(attemptId)
  if (!parsed.success) return { ok: false, error: TRY_AGAIN }

  const result = await submitAttempt(parsed.data)
  if (result.ok) return { ok: true }
  if (result.code === "attempt_not_found") {
    return { ok: false, error: "This attempt could not be found." }
  }
  return { ok: false, error: "Your answers could not be submitted. Please try again." }
}
