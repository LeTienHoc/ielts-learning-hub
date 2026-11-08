import "server-only"

import { z } from "zod"

import { PRACTICE_SET_KINDS, type PracticeSetKind } from "@/lib/content/practice-set-schema"
import { bandEstimate } from "@/lib/learning/reading-band"
import { createSupabaseServerClient } from "@/server/database/server-client"

import type { AttemptMode } from "./practice-service"

/** A submitted Reading attempt for the history list (READ-07). */
export type ReadingHistoryItem = {
  attemptId: string
  setSlug: string
  setTitle: string
  kind: PracticeSetKind
  mode: AttemptMode
  submittedAt: string
  score: number
  maxScore: number
  /** Estimated band for a full test; null otherwise. */
  band: number | null
}

const rowSchema = z.object({
  id: z.string(),
  mode: z.enum(["learn", "test"]),
  submitted_at: z.string(),
  score: z.number(),
  max_score: z.number(),
  practice_sets: z.object({
    module: z.string(),
    kind: z.enum(PRACTICE_SET_KINDS),
    content_items: z.object({ slug: z.string(), title: z.string() }),
  }),
})

/** The learner's submitted Reading attempts, newest first (RLS limits rows to their own). */
export async function listReadingHistory(
  options: { practiceSetId?: string; limit?: number } = {},
): Promise<ReadingHistoryItem[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from("attempts")
    .select(
      "id, mode, submitted_at, score, max_score, practice_sets!inner(module, kind, content_items!inner(slug, title))",
    )
    .eq("status", "submitted")
    .eq("practice_sets.module", "reading")
    .order("submitted_at", { ascending: false })
    .limit(options.limit ?? 50)
  if (options.practiceSetId) query = query.eq("practice_set_id", options.practiceSetId)

  const { data, error } = await query
  if (error) throw new Error("Could not load your reading history.")

  return z
    .array(rowSchema)
    .parse(data)
    .map((row) => ({
      attemptId: row.id,
      setSlug: row.practice_sets.content_items.slug,
      setTitle: row.practice_sets.content_items.title,
      kind: row.practice_sets.kind,
      mode: row.mode,
      submittedAt: row.submitted_at,
      score: row.score,
      maxScore: row.max_score,
      band: bandEstimate(row.practice_sets.kind, row.score, row.max_score),
    }))
}
