import "server-only"

import { z } from "zod"

import {
  CONTENT_LEVELS,
  CONTENT_TOPICS,
  type ContentLevel,
  type ContentTopic,
} from "@/lib/content/practice-set-schema"
import { toEngineError, type EngineResult } from "@/lib/learning/engine-errors"
import { gardenStage, MASTERED_INTERVAL_DAYS, type GardenStage } from "@/lib/learning/mastery"
import { splitSessionRows } from "@/lib/learning/session-plan"
import { createSupabaseServerClient } from "@/server/database/server-client"

// Vocabulary data access. Reads use RLS (published words, own SRS state); every write goes
// through the definer functions in supabase/migrations/20261109110000_vocabulary_srs.sql.

/** At most this many due reviews in one session (spec §5.1); the rest are offered as extra. */
export const SESSION_REVIEW_CAP = 30
/** Weekly goal in days (spec §5.5). */
export const WEEKLY_GOAL_DAYS = 5

const exampleSchema = z.object({ en: z.string(), vi: z.string(), cloze: z.string() })
const mistakeSchema = z.object({
  wrong: z.string(),
  right: z.string(),
  whyEn: z.string(),
  whyVi: z.string(),
})

const wordRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  lemma: z.string(),
  part_of_speech: z.string(),
  ipa: z.string().nullable(),
  meaning_en: z.string(),
  meaning_vi: z.string(),
  examples: z.array(exampleSchema),
  collocations: z.array(z.string()),
  common_mistakes: z.array(mistakeSchema),
  topics: z.array(z.string()),
})
const WORD_COLUMNS =
  "id, slug, lemma, part_of_speech, ipa, meaning_en, meaning_vi, examples, collocations, common_mistakes, topics"

const userWordRowSchema = z.object({
  word_id: z.string(),
  status: z.enum(["new", "learning"]),
  interval_days: z.number(),
  review_count: z.number(),
  due_at: z.string().nullable(),
  introduced_at: z.string().nullable(),
})
const USER_WORD_COLUMNS = "word_id, status, interval_days, review_count, due_at, introduced_at"

export type WordSummary = {
  id: string
  slug: string
  lemma: string
  partOfSpeech: string
  meaningEn: string
  meaningVi: string
  inMyWords: boolean
}

export type WordDetail = WordSummary & {
  ipa: string | null
  examples: z.infer<typeof exampleSchema>[]
  collocations: string[]
  commonMistakes: z.infer<typeof mistakeSchema>[]
  srs: {
    status: "new" | "learning"
    intervalDays: number
    dueAt: string | null
    isMastered: boolean
  } | null
}

export type ReviewCard = Omit<WordDetail, "inMyWords" | "srs"> & {
  reviewCount: number
  intervalDays: number
}

export type ReviewSessionPlan = {
  startedAt: string
  newWords: ReviewCard[]
  dueWords: ReviewCard[]
  extraDueCount: number
}

export type VocabularySetSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  level: ContentLevel
  topics: ContentTopic[]
  wordCount: number
  addedCount: number
}

export type VocabularySetDetail = VocabularySetSummary & { words: WordSummary[] }

export type GardenBed = {
  topic: ContentTopic
  plants: { wordSlug: string; lemma: string; stage: GardenStage }[]
}

type WordRow = z.infer<typeof wordRowSchema>

function toSummary(row: WordRow, inMyWords: boolean): WordSummary {
  return {
    id: row.id,
    slug: row.slug,
    lemma: row.lemma,
    partOfSpeech: row.part_of_speech,
    meaningEn: row.meaning_en,
    meaningVi: row.meaning_vi,
    inMyWords,
  }
}

function toCard(row: WordRow, state: z.infer<typeof userWordRowSchema>): ReviewCard {
  const { inMyWords: _inMyWords, ...summary } = toSummary(row, true)
  return {
    ...summary,
    ipa: row.ipa,
    examples: row.examples,
    collocations: row.collocations,
    commonMistakes: row.common_mistakes,
    reviewCount: state.review_count,
    intervalDays: state.interval_days,
  }
}

async function myWords() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("user_words").select(USER_WORD_COLUMNS)
  if (error) throw new Error("Could not load your words.")
  return z.array(userWordRowSchema).parse(data)
}

const setRowSchema = z.object({
  id: z.string(),
  content_items: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    level: z.enum(CONTENT_LEVELS),
    topics: z.array(z.enum(CONTENT_TOPICS)),
  }),
  vocabulary_set_words: z.array(z.object({ word_id: z.string(), position: z.number() })),
})

function toSetSummary(row: z.infer<typeof setRowSchema>, mine: Set<string>): VocabularySetSummary {
  return {
    id: row.id,
    slug: row.content_items.slug,
    title: row.content_items.title,
    summary: row.content_items.summary,
    level: row.content_items.level,
    topics: row.content_items.topics,
    wordCount: row.vocabulary_set_words.length,
    addedCount: row.vocabulary_set_words.filter((link) => mine.has(link.word_id)).length,
  }
}

export async function listVocabularySets(): Promise<VocabularySetSummary[]> {
  const supabase = await createSupabaseServerClient()
  const [{ data, error }, words] = await Promise.all([
    supabase
      .from("vocabulary_sets")
      .select(
        "id, content_items!inner(slug, title, summary, level, topics), vocabulary_set_words(word_id, position)",
      ),
    myWords(),
  ])
  if (error) throw new Error("Could not load vocabulary sets.")
  const mine = new Set(words.map((word) => word.word_id))
  return z
    .array(setRowSchema)
    .parse(data)
    .map((row) => toSetSummary(row, mine))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function getVocabularySet(slug: string): Promise<VocabularySetDetail | null> {
  const supabase = await createSupabaseServerClient()
  const [{ data, error }, words] = await Promise.all([
    supabase
      .from("vocabulary_sets")
      .select(
        `id, content_items!inner(slug, title, summary, level, topics),
         vocabulary_set_words(word_id, position, words(${WORD_COLUMNS}))`,
      )
      .eq("content_items.slug", slug)
      .maybeSingle(),
    myWords(),
  ])
  if (error) throw new Error("Could not load the vocabulary set.")
  if (!data) return null

  const row = setRowSchema
    .extend({
      vocabulary_set_words: z.array(
        z.object({ word_id: z.string(), position: z.number(), words: wordRowSchema }),
      ),
    })
    .parse(data)
  const mine = new Set(words.map((word) => word.word_id))
  return {
    ...toSetSummary(row, mine),
    words: [...row.vocabulary_set_words]
      .sort((a, b) => a.position - b.position)
      .map((link) => toSummary(link.words, mine.has(link.word_id))),
  }
}

export async function getWord(slug: string): Promise<WordDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("words")
    .select(WORD_COLUMNS)
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw new Error("Could not load the word.")
  if (!data) return null

  const row = wordRowSchema.parse(data)
  const { data: stateData, error: stateError } = await supabase
    .from("user_words")
    .select(USER_WORD_COLUMNS)
    .eq("word_id", row.id)
    .maybeSingle()
  if (stateError) throw new Error("Could not load the word.")
  const state = stateData ? userWordRowSchema.parse(stateData) : null

  return {
    ...toSummary(row, state !== null),
    ipa: row.ipa,
    examples: row.examples,
    collocations: row.collocations,
    commonMistakes: row.common_mistakes,
    srs: state
      ? {
          status: state.status,
          intervalDays: state.interval_days,
          dueAt: state.due_at,
          isMastered: state.interval_days >= MASTERED_INTERVAL_DAYS,
        }
      : null,
  }
}

/** Local calendar date (YYYY-MM-DD) of an instant in a time zone. */
function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant)
}

export async function getVocabularyOverview(): Promise<{
  dueCount: number
  newWaitingCount: number
  newAllowanceToday: number
  myWordsCount: number
  masteredCount: number
}> {
  const supabase = await createSupabaseServerClient()
  const [words, { data: profile, error }] = await Promise.all([
    myWords(),
    supabase.from("profiles").select("timezone, daily_new_words").maybeSingle(),
  ])
  if (error || !profile) throw new Error("Could not load your vocabulary progress.")

  const now = new Date()
  const today = localDate(now, profile.timezone)
  const introducedToday = words.filter(
    (word) =>
      word.introduced_at && localDate(new Date(word.introduced_at), profile.timezone) === today,
  ).length
  const newWaitingCount = words.filter((word) => word.status === "new").length

  return {
    dueCount: words.filter(
      (word) => word.status === "learning" && word.due_at && new Date(word.due_at) <= now,
    ).length,
    newWaitingCount,
    newAllowanceToday: Math.min(
      newWaitingCount,
      Math.max(0, profile.daily_new_words - introducedToday),
    ),
    myWordsCount: words.length,
    masteredCount: words.filter((word) => word.interval_days >= MASTERED_INTERVAL_DAYS).length,
  }
}

/**
 * Starts today's session: introduces new words up to the daily limit (server-side), then loads
 * up to SESSION_REVIEW_CAP due reviews, oldest first.
 */
export async function startReviewSession(): Promise<ReviewSessionPlan> {
  const supabase = await createSupabaseServerClient()
  // Slack for clock differences between this server and the database (see the ledger ruling).
  const startedAt = new Date(Date.now() - 60_000).toISOString()

  const { error: introduceError } = await supabase.rpc("introduce_new_words")
  if (introduceError) throw new Error("Could not start the review session.")

  // Never-reviewed words (just introduced, or left from an abandoned session) regardless of
  // due time, plus words that are due. The split below gives new words their card first.
  const { data, error } = await supabase
    .from("user_words")
    .select(`${USER_WORD_COLUMNS}, words(${WORD_COLUMNS})`)
    .eq("status", "learning")
    .or(`review_count.eq.0,due_at.lte.${new Date().toISOString()}`)
  if (error) throw new Error("Could not start the review session.")

  const rows = z.array(userWordRowSchema.extend({ words: wordRowSchema })).parse(data)
  const { fresh, due, extraDueCount } = splitSessionRows(rows, SESSION_REVIEW_CAP)

  return {
    startedAt,
    newWords: fresh.map((row) => toCard(row.words, row)),
    dueWords: due.map((row) => toCard(row.words, row)),
    extraDueCount,
  }
}

export type ReviewGrade = "again" | "hard" | "good" | "easy"
export type ReviewExercise = "intro" | "recall" | "cloze" | "collocation" | "match"

export async function reviewWord(input: {
  wordId: string
  grade: ReviewGrade
  exercise: ReviewExercise
  expectedReviewCount: number
}): Promise<EngineResult<{ dueAt: string }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("review_word", {
    target_word_id: input.wordId,
    grade: input.grade,
    exercise: input.exercise,
    expected_review_count: input.expectedReviewCount,
  })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: { dueAt: z.string().parse(data) } }
}

export async function finishReviewSession(startedAt: string): Promise<EngineResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("finish_review_session", { session_started_at: startedAt })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: null }
}

export async function addSetToMyWords(setId: string): Promise<EngineResult<number>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("add_set_to_my_words", { target_set_id: setId })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: z.number().parse(data) }
}

export async function addWordToMyWords(wordId: string): Promise<EngineResult<boolean>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("add_word_to_my_words", { target_word_id: wordId })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: z.boolean().parse(data) }
}

/** My words as a garden: one bed per word's first topic, in catalogue topic order. */
export async function getWordGarden(): Promise<GardenBed[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("user_words")
    .select("status, interval_days, words(slug, lemma, topics)")
  if (error) throw new Error("Could not load your word garden.")

  const rows = z
    .array(
      z.object({
        status: z.enum(["new", "learning"]),
        interval_days: z.number(),
        words: z.object({ slug: z.string(), lemma: z.string(), topics: z.array(z.string()) }),
      }),
    )
    .parse(data)

  return CONTENT_TOPICS.map((topic) => ({
    topic,
    plants: rows
      .filter((row) => row.words.topics[0] === topic)
      .map((row) => ({
        wordSlug: row.words.slug,
        lemma: row.words.lemma,
        stage: gardenStage(row.status, row.interval_days),
      }))
      .sort((a, b) => a.lemma.localeCompare(b.lemma)),
  })).filter((bed) => bed.plants.length > 0)
}

export async function getWeeklyGoal(): Promise<{ daysThisWeek: number; goal: number }> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("weekly_review_days")
  if (error) throw new Error("Could not load your weekly goal.")
  return { daysThisWeek: z.number().parse(data), goal: WEEKLY_GOAL_DAYS }
}
