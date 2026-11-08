import { z } from "zod"

// Content authoring format for practice sets (content/practice-sets/*.json) and the shared
// constants the app uses to render them. Mirrors the CHECK constraints in
// supabase/migrations/20261108100000_content_and_practice_engine.sql and 20261110100000_reading_passages.sql.
// Imported by Node scripts: external packages and sibling files with their `.ts` extension only.
import {
  CONTENT_LEVELS,
  CONTENT_SOURCES,
  CONTENT_TOPICS,
  REVIEW_STATUSES,
  type ContentLevel,
  type ContentTopic,
} from "./catalogue.ts"
import { wordSourceSchema } from "./vocabulary-schema.ts"

export { CONTENT_LEVELS, CONTENT_SOURCES, CONTENT_TOPICS, REVIEW_STATUSES }
export type { ContentLevel, ContentTopic }
export const PRACTICE_MODULES = ["reading", "listening", "grammar"] as const
export const RESPONSE_KINDS = ["single", "multiple", "text"] as const

export type PracticeModule = (typeof PRACTICE_MODULES)[number]
export type ResponseKind = (typeof RESPONSE_KINDS)[number]

/** IELTS question types and the kind of answer each one takes. */
export const QUESTION_TYPE_RESPONSE_KIND = {
  true_false_not_given: "single",
  yes_no_not_given: "single",
  multiple_choice: "single",
  multiple_choice_multi: "multiple",
  matching_headings: "single",
  matching_information: "single",
  matching_features: "single",
  sentence_completion: "text",
  summary_completion: "text",
  short_answer: "text",
  gap_fill: "text",
  // "Spot the mistake": the options are the sentence's words (see tokenizeSentence).
  error_correction: "single",
  sentence_transformation: "text",
} as const satisfies Record<string, ResponseKind>

export type QuestionType = keyof typeof QUESTION_TYPE_RESPONSE_KIND
export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_RESPONSE_KIND) as [
  QuestionType,
  ...QuestionType[],
]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  multiple_choice: "Multiple choice",
  multiple_choice_multi: "Multiple choice (more than one answer)",
  matching_headings: "Matching headings",
  matching_information: "Matching information",
  matching_features: "Matching features",
  sentence_completion: "Sentence completion",
  summary_completion: "Summary completion",
  short_answer: "Short answer",
  gap_fill: "Gap fill",
  error_correction: "Spot the mistake",
  sentence_transformation: "Sentence transformation",
}

/** Options used when a True/False/Not Given or Yes/No/Not Given group lists none. */
export const DEFAULT_TYPE_OPTIONS: Partial<Record<QuestionType, readonly AnswerOption[]>> = {
  true_false_not_given: [
    { id: "TRUE", text: "TRUE" },
    { id: "FALSE", text: "FALSE" },
    { id: "NOT_GIVEN", text: "NOT GIVEN" },
  ],
  yes_no_not_given: [
    { id: "YES", text: "YES" },
    { id: "NO", text: "NO" },
    { id: "NOT_GIVEN", text: "NOT GIVEN" },
  ],
}

/**
 * Splits a sentence into tappable words for "Spot the mistake". `word` is the lower-case
 * word without surrounding punctuation, used to find the mistake.
 */
export function tokenizeSentence(sentence: string): { id: string; text: string; word: string }[] {
  return sentence
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      id: `t${index + 1}`,
      text,
      word: text.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "").toLowerCase(),
    }))
}

export const answerOptionSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_]{1,20}$/, "Option ids are short letters/digits"),
  text: z.string().min(1).max(500),
})
export type AnswerOption = z.infer<typeof answerOptionSchema>

const optionsSchema = z
  .array(answerOptionSchema)
  .min(2)
  .max(20)
  .refine((options) => new Set(options.map((option) => option.id)).size === options.length, {
    message: "Option ids must be unique",
  })

const answerTextSchema = z.string().trim().min(1).max(200)

const questionSchema = z.object({
  number: z.int().min(1).max(200),
  prompt: z.string().min(1).max(1000),
  options: optionsSchema.optional(),
  /** Option ids (choice questions) or accepted variants (text questions). */
  accepted: z.array(answerTextSchema).min(1).max(20),
  /** Text questions: the word limit shown to the learner. */
  maxWords: z.int().min(1).max(10).optional(),
  explanation: z.string().min(1).max(2000),
  explanationVi: z.string().min(1).max(2000).optional(),
  /** Exact quote from the passage that supports the answer (located automatically). */
  evidence: z.string().min(1).max(2000).optional(),
  /** Spot the mistake: the corrected sentence shown after answering. */
  correction: z.string().min(1).max(1000).optional(),
})

const groupSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  instructions: z.string().min(1).max(1000),
  options: optionsSchema.optional(),
  /** 1-based passage this group belongs to (default 1 when the set has passages). */
  passage: z.int().min(1).max(3).optional(),
  questions: z.array(questionSchema).min(1).max(40),
})

/** A word underlined in a passage; `form` is its exact text in the passage (first occurrence). */
const keyWordSchema = z.object({ form: z.string().min(1).max(80), word: wordSourceSchema })

const passageSchema = z.object({
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(20000),
  keyWords: z.array(keyWordSchema).max(12).default([]),
})

export const PRACTICE_SET_KINDS = ["practice", "full_test"] as const
export type PracticeSetKind = (typeof PRACTICE_SET_KINDS)[number]
/** A full IELTS Academic Reading test. */
export const FULL_TEST = { passages: 3, marks: 40, minutes: 60 } as const

/** Marks of a question: one per question, or one per accepted option for multi-answer. */
export function questionMarks(type: QuestionType, accepted: readonly string[]): number {
  return QUESTION_TYPE_RESPONSE_KIND[type] === "multiple" ? accepted.length : 1
}

export const practiceSetSourceSchema = z
  .object({
    slug: z
      .string()
      .max(80)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slugs use lower-case words joined by hyphens"),
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(500).optional(),
    level: z.enum(CONTENT_LEVELS),
    topics: z.array(z.enum(CONTENT_TOPICS)).max(5).default([]),
    source: z.enum(CONTENT_SOURCES),
    reviewStatus: z.enum(REVIEW_STATUSES),
    version: z.int().min(1).default(1),
    module: z.enum(PRACTICE_MODULES),
    kind: z.enum(PRACTICE_SET_KINDS).default("practice"),
    /** Offers test mode with this time limit; omit for learn-only sets. */
    testTimeLimitMinutes: z.int().min(1).max(120).optional(),
    passages: z.array(passageSchema).max(3).default([]),
    groups: z.array(groupSchema).min(1).max(20),
  })
  .superRefine((set, context) => {
    const numbers = set.groups.flatMap((group) =>
      group.questions.map((question) => question.number),
    )
    numbers.forEach((number, index) => {
      if (index > 0 && number <= (numbers[index - 1] ?? 0)) {
        context.addIssue({ code: "custom", message: `Question ${number} is out of order` })
      }
    })

    set.groups.forEach((group, groupIndex) => {
      const kind = QUESTION_TYPE_RESPONSE_KIND[group.type]
      group.questions.forEach((question) => {
        const where = `Group ${groupIndex + 1}, question ${question.number}`

        if (group.type === "error_correction") {
          if (question.options || group.options) {
            context.addIssue({
              code: "custom",
              message: `${where}: Spot-the-mistake options come from the sentence`,
            })
          }
          const [mistake, ...extra] = question.accepted
          const matches = tokenizeSentence(question.prompt).filter(
            (token) => token.word === mistake?.toLowerCase(),
          )
          if (extra.length > 0 || matches.length !== 1) {
            context.addIssue({
              code: "custom",
              message: `${where}: the mistake must be exactly one word that appears once`,
            })
          }
          if (!question.correction) {
            context.addIssue({
              code: "custom",
              message: `${where}: Spot-the-mistake items need a correction`,
            })
          }
          return
        }
        if (question.correction) {
          context.addIssue({
            code: "custom",
            message: `${where}: only Spot-the-mistake items take a correction`,
          })
        }

        const options = question.options ?? group.options ?? DEFAULT_TYPE_OPTIONS[group.type]

        if (kind === "text") {
          if (question.options) {
            context.addIssue({
              code: "custom",
              message: `${where}: text questions take no options`,
            })
          }
          const limit = question.maxWords
          if (limit && question.accepted.some((answer) => answer.split(/\s+/).length > limit)) {
            context.addIssue({ code: "custom", message: `${where}: an answer exceeds maxWords` })
          }
          return
        }

        if (question.maxWords) {
          context.addIssue({ code: "custom", message: `${where}: maxWords is for text questions` })
        }
        if (!options) {
          context.addIssue({ code: "custom", message: `${where}: choice questions need options` })
          return
        }
        const ids = new Set(options.map((option) => option.id))
        if (question.accepted.some((answer) => !ids.has(answer))) {
          context.addIssue({ code: "custom", message: `${where}: accepted ids must be options` })
        }
        if (new Set(question.accepted).size !== question.accepted.length) {
          context.addIssue({ code: "custom", message: `${where}: accepted ids repeat` })
        }
        if (kind === "single" && question.accepted.length !== 1) {
          context.addIssue({ code: "custom", message: `${where}: needs exactly one accepted id` })
        }
        if (kind === "multiple" && (question.accepted.length < 2 || question.accepted.length > 5)) {
          context.addIssue({ code: "custom", message: `${where}: needs 2 to 5 accepted ids` })
        }
      })
    })

    if (set.groups.some((group) => group.questions.some((question) => question.evidence))) {
      if (set.passages.length === 0) {
        context.addIssue({ code: "custom", message: "Evidence quotes need a passage" })
      }
    }

    set.groups.forEach((group, groupIndex) => {
      if (group.passage !== undefined && group.passage > set.passages.length) {
        context.addIssue({
          code: "custom",
          message: `Group ${groupIndex + 1} refers to passage ${group.passage}, which does not exist`,
        })
      }
    })

    set.passages.forEach((passage, passageIndex) => {
      for (const keyWord of passage.keyWords) {
        if (!passage.text.includes(keyWord.form)) {
          context.addIssue({
            code: "custom",
            message: `Key word "${keyWord.form}" is not in passage ${passageIndex + 1}`,
          })
        }
      }
    })

    if (set.kind === "full_test") {
      if (set.passages.length !== FULL_TEST.passages) {
        context.addIssue({ code: "custom", message: "A full test needs 3 passages" })
      }
      const marks = set.groups.reduce(
        (total, group) =>
          total +
          group.questions.reduce(
            (sum, question) => sum + questionMarks(group.type, question.accepted),
            0,
          ),
        0,
      )
      if (marks !== FULL_TEST.marks) {
        context.addIssue({ code: "custom", message: `A full test has 40 marks (found ${marks})` })
      }
      if (set.testTimeLimitMinutes !== FULL_TEST.minutes) {
        context.addIssue({ code: "custom", message: "A full test takes 60 minutes in test mode" })
      }
    }
  })

export type PracticeSetSource = z.infer<typeof practiceSetSourceSchema>
