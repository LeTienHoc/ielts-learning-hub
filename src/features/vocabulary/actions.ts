"use server"

import { z } from "zod"

import {
  addSetToMyWords,
  addWordToMyWords,
  finishReviewSession,
  reviewWord,
} from "@/server/vocabulary/vocabulary-service"

const TRY_AGAIN = "Something went wrong. Please try again."

export type VocabularyActionResult = { ok: true } | { ok: false; error: string }

export async function addSetToMyWordsAction(setId: string): Promise<VocabularyActionResult> {
  const parsed = z.uuid().safeParse(setId)
  if (!parsed.success) return { ok: false, error: TRY_AGAIN }
  const result = await addSetToMyWords(parsed.data)
  if (result.ok) return { ok: true }
  return {
    ok: false,
    error: result.code === "set_not_found" ? "This set is no longer available." : TRY_AGAIN,
  }
}

export async function addWordToMyWordsAction(wordId: string): Promise<VocabularyActionResult> {
  const parsed = z.uuid().safeParse(wordId)
  if (!parsed.success) return { ok: false, error: TRY_AGAIN }
  const result = await addWordToMyWords(parsed.data)
  return result.ok ? { ok: true } : { ok: false, error: TRY_AGAIN }
}

const reviewInputSchema = z.object({
  wordId: z.uuid(),
  grade: z.enum(["again", "hard", "good", "easy"]),
  exercise: z.enum(["intro", "recall", "cloze", "collocation", "match"]),
  expectedReviewCount: z.int().min(0),
})

export type ReviewWordInput = z.infer<typeof reviewInputSchema>

/** Grades one review on the server (SM-2). stale_review means it was already graded elsewhere. */
export async function reviewWordAction(
  input: ReviewWordInput,
): Promise<{ ok: true } | { ok: false; reason: "stale" | "failed" }> {
  const parsed = reviewInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: "failed" }
  const result = await reviewWord(parsed.data)
  if (result.ok) return { ok: true }
  return { ok: false, reason: result.code === "stale_review" ? "stale" : "failed" }
}

export async function finishReviewSessionAction(
  startedAt: string,
): Promise<VocabularyActionResult> {
  const parsed = z.iso.datetime().safeParse(startedAt)
  if (!parsed.success) return { ok: false, error: TRY_AGAIN }
  const result = await finishReviewSession(parsed.data)
  return result.ok ? { ok: true } : { ok: false, error: TRY_AGAIN }
}
