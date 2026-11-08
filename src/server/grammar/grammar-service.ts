import "server-only"

import { z } from "zod"

import { grammarLessonSchema, type GrammarLesson } from "@/lib/content/grammar-schema"
import { CONTENT_LEVELS, type ContentLevel } from "@/lib/content/practice-set-schema"
import { masteryFromScore, type Mastery } from "@/lib/learning/mastery"
import { createSupabaseServerClient } from "@/server/database/server-client"

// Grammar topics (lessons) and mastery. Practice runs on the P2 engine
// (src/server/practice/practice-service.ts) with module "grammar".

export type GrammarTopicSummary = {
  slug: string
  title: string
  summary: string | null
  level: ContentLevel
  position: number
  mastery: Mastery
  lastScorePercent: number | null
}

export type GrammarTopicDetail = GrammarTopicSummary & {
  lesson: GrammarLesson
  practiceSetId: string | null
  practiceSetSlug: string | null
}

const topicRowSchema = z.object({
  id: z.string(),
  position: z.number(),
  practice_set_id: z.string().nullable(),
  content_items: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    level: z.enum(CONTENT_LEVELS),
  }),
})

/** Latest submitted score per practice set for the signed-in learner. */
async function latestScores(practiceSetIds: string[]) {
  const scores = new Map<string, { score: number; maxScore: number }>()
  if (practiceSetIds.length === 0) return scores

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("attempts")
    .select("practice_set_id, score, max_score, submitted_at")
    .in("practice_set_id", practiceSetIds)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
  if (error) throw new Error("Could not load your grammar progress.")

  const rows = z
    .array(
      z.object({
        practice_set_id: z.string(),
        score: z.number(),
        max_score: z.number(),
      }),
    )
    .parse(data)
  for (const row of rows) {
    if (!scores.has(row.practice_set_id)) {
      scores.set(row.practice_set_id, { score: row.score, maxScore: row.max_score })
    }
  }
  return scores
}

function toSummary(
  row: z.infer<typeof topicRowSchema>,
  scores: Map<string, { score: number; maxScore: number }>,
): GrammarTopicSummary {
  const latest = row.practice_set_id ? scores.get(row.practice_set_id) : undefined
  const { mastery, percent } = masteryFromScore(latest?.score ?? null, latest?.maxScore ?? null)
  return {
    slug: row.content_items.slug,
    title: row.content_items.title,
    summary: row.content_items.summary,
    level: row.content_items.level,
    position: row.position,
    mastery,
    lastScorePercent: percent,
  }
}

/** Published grammar topics in lesson order, with the learner's mastery. */
export async function listGrammarTopics(): Promise<GrammarTopicSummary[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("grammar_topics")
    .select("id, position, practice_set_id, content_items!inner(slug, title, summary, level)")
  if (error) throw new Error("Could not load grammar topics.")

  const rows = z.array(topicRowSchema).parse(data)
  const scores = await latestScores(
    rows.flatMap((row) => (row.practice_set_id ? [row.practice_set_id] : [])),
  )
  return rows.map((row) => toSummary(row, scores)).sort((a, b) => a.position - b.position)
}

export async function getGrammarTopic(slug: string): Promise<GrammarTopicDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("grammar_topics")
    .select(
      "id, position, practice_set_id, lesson, content_items!inner(slug, title, summary, level), practice_sets(content_items(slug))",
    )
    .eq("content_items.slug", slug)
    .maybeSingle()
  if (error) throw new Error("Could not load the grammar topic.")
  if (!data) return null

  const row = topicRowSchema
    .extend({
      lesson: grammarLessonSchema,
      practice_sets: z.object({ content_items: z.object({ slug: z.string() }) }).nullable(),
    })
    .parse(data)
  const scores = await latestScores(row.practice_set_id ? [row.practice_set_id] : [])

  return {
    ...toSummary(row, scores),
    lesson: row.lesson,
    practiceSetId: row.practice_set_id,
    practiceSetSlug: row.practice_sets?.content_items.slug ?? null,
  }
}
