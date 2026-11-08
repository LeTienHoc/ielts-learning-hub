import "server-only"

import { z } from "zod"

import {
  answerOptionSchema,
  CONTENT_LEVELS,
  CONTENT_TOPICS,
  PRACTICE_SET_KINDS,
  QUESTION_TYPES,
  RESPONSE_KINDS,
  type AnswerOption,
  type ContentLevel,
  type ContentTopic,
  type PracticeModule,
  type QuestionType,
  type PracticeSetKind,
  type ResponseKind,
} from "@/lib/content/practice-set-schema"
import { toEngineError, type EngineResult } from "@/lib/learning/engine-errors"
import { createSupabaseServerClient } from "@/server/database/server-client"

// Practice engine data access. Reads use RLS (published content, own attempts); writes go
// through the security-definer functions in the P2 migration, which own the business rules.

const optionsSchema = z.array(answerOptionSchema).nullable()
const responseSchema = z.array(z.string())

export type PracticeSetSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  level: ContentLevel
  topics: ContentTopic[]
  questionCount: number
  testTimeLimitSeconds: number | null
  kind: PracticeSetKind
  /** Distinct question types, in group order (library filters, READ-01). */
  questionTypes: QuestionType[]
  passageCount: number
}

/** A word underlined in a passage (READ-06). */
export type PassageKeyWord = {
  wordId: string
  slug: string
  lemma: string
  form: string
  meaningEn: string
  meaningVi: string
  inMyWords: boolean
}

export type PracticePassage = {
  id: string
  position: number
  title: string | null
  text: string
  keyWords: PassageKeyWord[]
}

export type PracticeQuestion = {
  id: string
  number: number
  prompt: string
  responseKind: ResponseKind
  /** Choice questions: this question's options, or the group's shared options. */
  options: AnswerOption[]
  selectCount: number | null
  maxWords: number | null
}

export type PracticeQuestionGroup = {
  id: string
  type: QuestionType
  instructions: string
  /** Options listed once for the whole group (e.g. headings), if any. */
  sharedOptions: AnswerOption[]
  /** The passage this group's questions (and evidence offsets) refer to. */
  passageId: string | null
  questions: PracticeQuestion[]
}

export type PracticeSetDetail = PracticeSetSummary & {
  passages: PracticePassage[]
  groups: PracticeQuestionGroup[]
}

export type AttemptMode = "learn" | "test"

export type AttemptState = {
  id: string
  practiceSetId: string
  mode: AttemptMode
  status: "in_progress" | "submitted"
  startedAt: string
  deadlineAt: string | null
  /** Test mode, in progress: milliseconds left when loaded (0 = expired). Otherwise null. */
  remainingMs: number | null
  submittedAt: string | null
  submitReason: "learner" | "time_expired" | null
  score: number | null
  maxScore: number | null
  answers: Record<string, string[]>
  results: Record<string, { isCorrect: boolean; points: number }>
}

export type AnswerKey = {
  questionId: string
  accepted: string[]
  explanation: string
  explanationVi: string | null
  evidence: { start: number; end: number } | null
  /** Spot the mistake: the corrected sentence. */
  correction: string | null
}

const summaryRowSchema = z.object({
  id: z.string(),
  kind: z.enum(PRACTICE_SET_KINDS),
  test_time_limit_seconds: z.number().nullable(),
  content_items: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    level: z.enum(CONTENT_LEVELS),
    topics: z.array(z.enum(CONTENT_TOPICS)),
  }),
  question_groups: z.array(
    z.object({ position: z.number(), question_type: z.enum(QUESTION_TYPES) }).passthrough(),
  ),
  practice_set_passages: z.array(z.object({ id: z.string() }).passthrough()),
})

function toSummary(
  row: z.infer<typeof summaryRowSchema>,
  questionCount: number,
): PracticeSetSummary {
  const types = [...row.question_groups]
    .sort((a, b) => a.position - b.position)
    .map((group) => group.question_type)
  return {
    id: row.id,
    slug: row.content_items.slug,
    title: row.content_items.title,
    summary: row.content_items.summary,
    level: row.content_items.level,
    topics: row.content_items.topics,
    questionCount,
    testTimeLimitSeconds: row.test_time_limit_seconds,
    kind: row.kind,
    questionTypes: [...new Set(types)],
    passageCount: row.practice_set_passages.length,
  }
}

/** Published practice sets of a module, sorted by title. */
export async function listPublishedPracticeSets(
  module: PracticeModule,
): Promise<PracticeSetSummary[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("practice_sets")
    .select(
      "id, kind, test_time_limit_seconds, content_items!inner(slug, title, summary, level, topics), question_groups(position, question_type), practice_set_passages(id), questions(count)",
    )
    .eq("module", module)
  if (error) throw new Error("Could not load practice sets.")

  return z
    .array(summaryRowSchema.extend({ questions: z.array(z.object({ count: z.number() })) }))
    .parse(data)
    .map((row) => toSummary(row, row.questions[0]?.count ?? 0))
    .sort((a, b) => a.title.localeCompare(b.title))
}

const detailRowSchema = summaryRowSchema.extend({
  question_groups: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
      question_type: z.enum(QUESTION_TYPES),
      instructions: z.string(),
      options: optionsSchema,
      passage_id: z.string().nullable(),
      questions: z.array(
        z.object({
          id: z.string(),
          position: z.number(),
          number: z.number(),
          prompt: z.string(),
          options: optionsSchema,
          response_kind: z.enum(RESPONSE_KINDS),
          select_count: z.number().nullable(),
          max_words: z.number().nullable(),
        }),
      ),
    }),
  ),
  practice_set_passages: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
      title: z.string().nullable(),
      text: z.string(),
      practice_set_words: z.array(
        z.object({
          word_id: z.string(),
          form: z.string(),
          words: z.object({
            slug: z.string(),
            lemma: z.string(),
            meaning_en: z.string(),
            meaning_vi: z.string(),
          }),
        }),
      ),
    }),
  ),
})

/** A published practice set with its passages and questions (never answer keys), or null. */
export async function getPracticeSetBySlug(
  module: PracticeModule,
  slug: string,
): Promise<PracticeSetDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("practice_sets")
    .select(
      `id, kind, test_time_limit_seconds,
       content_items!inner(slug, title, summary, level, topics),
       practice_set_passages(id, position, title, text,
         practice_set_words(word_id, form, words(slug, lemma, meaning_en, meaning_vi))),
       question_groups(id, position, question_type, instructions, options, passage_id,
         questions(id, position, number, prompt, options, response_kind, select_count, max_words))`,
    )
    .eq("module", module)
    .eq("content_items.slug", slug)
    .maybeSingle()
  if (error) throw new Error("Could not load the practice set.")
  if (!data) return null

  const row = detailRowSchema.parse(data)
  const keyWordIds = row.practice_set_passages.flatMap((passage) =>
    passage.practice_set_words.map((link) => link.word_id),
  )
  const mine = new Set<string>()
  if (keyWordIds.length > 0) {
    const { data: owned, error: ownedError } = await supabase
      .from("user_words")
      .select("word_id")
      .in("word_id", keyWordIds)
    if (ownedError) throw new Error("Could not load the practice set.")
    for (const item of z.array(z.object({ word_id: z.string() })).parse(owned))
      mine.add(item.word_id)
  }

  const passages = [...row.practice_set_passages]
    .sort((a, b) => a.position - b.position)
    .map((passage) => ({
      id: passage.id,
      position: passage.position,
      title: passage.title,
      text: passage.text,
      keyWords: passage.practice_set_words.map((link) => ({
        wordId: link.word_id,
        slug: link.words.slug,
        lemma: link.words.lemma,
        form: link.form,
        meaningEn: link.words.meaning_en,
        meaningVi: link.words.meaning_vi,
        inMyWords: mine.has(link.word_id),
      })),
    }))

  const groups = [...row.question_groups]
    .sort((a, b) => a.position - b.position)
    .map((group) => ({
      id: group.id,
      type: group.question_type,
      instructions: group.instructions,
      sharedOptions: group.options ?? [],
      passageId: group.passage_id,
      questions: [...group.questions]
        .sort((a, b) => a.position - b.position)
        .map((question) => ({
          id: question.id,
          number: question.number,
          prompt: question.prompt,
          responseKind: question.response_kind,
          options: question.options ?? group.options ?? [],
          selectCount: question.select_count,
          maxWords: question.max_words,
        })),
    }))

  return {
    ...toSummary(
      row,
      groups.reduce((count, group) => count + group.questions.length, 0),
    ),
    passages,
    groups,
  }
}

const attemptRowSchema = z.object({
  id: z.string(),
  practice_set_id: z.string(),
  mode: z.enum(["learn", "test"]),
  status: z.enum(["in_progress", "submitted"]),
  started_at: z.string(),
  deadline_at: z.string().nullable(),
  submitted_at: z.string().nullable(),
  submit_reason: z.enum(["learner", "time_expired"]).nullable(),
  score: z.number().nullable(),
  max_score: z.number().nullable(),
  attempt_answers: z.array(
    z.object({
      question_id: z.string(),
      response: responseSchema,
      is_correct: z.boolean().nullable(),
      points: z.number().nullable(),
    }),
  ),
})

/** The signed-in learner's attempt with answers, or null if it does not exist or is not theirs. */
export async function getAttempt(attemptId: string): Promise<AttemptState | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, practice_set_id, mode, status, started_at, deadline_at, submitted_at, submit_reason, score, max_score, attempt_answers(question_id, response, is_correct, points)",
    )
    .eq("id", attemptId)
    .maybeSingle()
  if (error) throw new Error("Could not load the attempt.")
  if (!data) return null

  const row = attemptRowSchema.parse(data)
  const answers: AttemptState["answers"] = {}
  const results: AttemptState["results"] = {}
  for (const answer of row.attempt_answers) {
    answers[answer.question_id] = answer.response
    if (answer.is_correct !== null) {
      results[answer.question_id] = { isCorrect: answer.is_correct, points: answer.points ?? 0 }
    }
  }

  return {
    id: row.id,
    practiceSetId: row.practice_set_id,
    mode: row.mode,
    status: row.status,
    startedAt: row.started_at,
    deadlineAt: row.deadline_at,
    // Request-time read (after the Supabase query). The database enforces the deadline itself.
    remainingMs:
      row.status === "in_progress" && row.deadline_at
        ? Math.max(0, Date.parse(row.deadline_at) - Date.now())
        : null,
    submittedAt: row.submitted_at,
    submitReason: row.submit_reason,
    score: row.score,
    maxScore: row.max_score,
    answers,
    results,
  }
}

/** The learner's in-progress attempt for a set, if any. */
export async function getActiveAttempt(
  practiceSetId: string,
): Promise<{ id: string; mode: AttemptMode } | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("attempts")
    .select("id, mode")
    .eq("practice_set_id", practiceSetId)
    .eq("status", "in_progress")
    .maybeSingle()
  if (error) throw new Error("Could not load the active attempt.")
  return data ? z.object({ id: z.string(), mode: z.enum(["learn", "test"]) }).parse(data) : null
}

export async function startAttempt(
  practiceSetId: string,
  mode: AttemptMode,
): Promise<EngineResult<string>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("start_attempt", {
    target_set_id: practiceSetId,
    attempt_mode: mode,
  })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: z.string().parse(data) }
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  response: string[],
): Promise<EngineResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("save_answer", {
    target_attempt_id: attemptId,
    target_question_id: questionId,
    answer: response,
  })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: null }
}

/** Submits (and scores) the attempt. Idempotent; records time_expired after the deadline. */
export async function submitAttempt(attemptId: string): Promise<EngineResult<null>> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("submit_attempt", { target_attempt_id: attemptId })
  if (error) return { ok: false, code: toEngineError(error) }
  return { ok: true, value: null }
}

const reviewRowSchema = z.object({
  question_id: z.string(),
  accepted: z.array(z.string()),
  explanation: z.string(),
  explanation_vi: z.string().nullable(),
  evidence_start: z.number().nullable(),
  evidence_end: z.number().nullable(),
  correction: z.string().nullable(),
})

/** Answer keys for the learner's own submitted attempt, keyed by question id. */
export async function getAttemptReview(
  attemptId: string,
): Promise<EngineResult<Record<string, AnswerKey>>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("get_attempt_review", {
    target_attempt_id: attemptId,
  })
  if (error) return { ok: false, code: toEngineError(error) }

  const keys: Record<string, AnswerKey> = {}
  for (const row of z.array(reviewRowSchema).parse(data)) {
    keys[row.question_id] = {
      questionId: row.question_id,
      accepted: row.accepted,
      explanation: row.explanation,
      explanationVi: row.explanation_vi,
      evidence:
        row.evidence_start !== null && row.evidence_end !== null
          ? { start: row.evidence_start, end: row.evidence_end }
          : null,
      correction: row.correction,
    }
  }
  return { ok: true, value: keys }
}

export type CheckedAnswer = {
  isCorrect: boolean
  points: number
  accepted: string[]
  explanation: string
  explanationVi: string | null
  correction: string | null
}

const checkRowSchema = z.object({
  is_correct: z.boolean(),
  points: z.number(),
  accepted: z.array(z.string()),
  explanation: z.string(),
  explanation_vi: z.string().nullable(),
  correction: z.string().nullable(),
})

/**
 * Learn mode: saves, locks and checks one answer, returning that question's key only.
 * Errors include answer_locked (already checked) and check_unavailable (test mode).
 */
export async function checkAnswer(
  attemptId: string,
  questionId: string,
  response: string[],
): Promise<EngineResult<CheckedAnswer>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("check_answer", {
    target_attempt_id: attemptId,
    target_question_id: questionId,
    answer: response,
  })
  if (error) return { ok: false, code: toEngineError(error) }

  const [row] = z.array(checkRowSchema).length(1).parse(data)
  if (!row) return { ok: false, code: "failed" }
  return {
    ok: true,
    value: {
      isCorrect: row.is_correct,
      points: row.points,
      accepted: row.accepted,
      explanation: row.explanation,
      explanationVi: row.explanation_vi,
      correction: row.correction,
    },
  }
}
