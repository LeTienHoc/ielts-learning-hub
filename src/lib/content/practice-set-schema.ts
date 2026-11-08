import { z } from "zod"

// Content authoring format for practice sets (content/practice-sets/*.json) and the shared
// constants the app uses to render them. Mirrors the CHECK constraints in
// supabase/migrations/20261108100000_content_and_practice_engine.sql.
// This file must import only external packages: scripts/build-content-seed.mts runs it in Node.

export const CONTENT_LEVELS = ["A2", "B1", "B2", "C1"] as const
export const CONTENT_TOPICS = [
  "education",
  "environment",
  "technology",
  "health",
  "work",
  "society",
  "culture",
  "media",
  "cities",
  "science",
] as const
export const CONTENT_SOURCES = ["original", "licensed", "ai_assisted"] as const
export const REVIEW_STATUSES = ["draft", "reviewed", "published"] as const
export const PRACTICE_MODULES = ["reading", "listening", "grammar"] as const
export const RESPONSE_KINDS = ["single", "multiple", "text"] as const

export type ContentLevel = (typeof CONTENT_LEVELS)[number]
export type ContentTopic = (typeof CONTENT_TOPICS)[number]
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
})

const groupSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  instructions: z.string().min(1).max(1000),
  options: optionsSchema.optional(),
  questions: z.array(questionSchema).min(1).max(40),
})

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
    /** Offers test mode with this time limit; omit for learn-only sets. */
    testTimeLimitMinutes: z.int().min(1).max(120).optional(),
    passage: z
      .object({ title: z.string().min(1).max(200), text: z.string().min(1).max(20000) })
      .optional(),
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
      if (!set.passage) {
        context.addIssue({ code: "custom", message: "Evidence quotes need a passage" })
      }
    }
  })

export type PracticeSetSource = z.infer<typeof practiceSetSourceSchema>
