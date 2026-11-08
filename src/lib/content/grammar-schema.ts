import { z } from "zod"

// Authoring format for grammar topics (content/grammar-topics/*.json): a short bilingual lesson
// plus a learn-mode practice set on the P2 engine. Imported by Node scripts, so it may only
// import external packages and sibling files with their `.ts` extension.
import {
  CONTENT_LEVELS,
  CONTENT_SOURCES,
  practiceSetSourceSchema,
  REVIEW_STATUSES,
  type PracticeSetSource,
} from "./practice-set-schema.ts"

const lessonSchema = z.object({
  introEn: z.string().min(1).max(1000),
  introVi: z.string().min(1).max(1000),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(120),
        bodyEn: z.string().min(1).max(2000),
        bodyVi: z.string().min(1).max(2000),
        examples: z
          .array(
            z.object({
              en: z.string().min(1).max(300),
              vi: z.string().min(1).max(300).optional(),
              note: z.string().min(1).max(300).optional(),
            }),
          )
          .max(6),
      }),
    )
    .min(1)
    .max(5),
  commonMistakes: z
    .array(
      z.object({
        wrong: z.string().min(1).max(200),
        right: z.string().min(1).max(200),
        whyEn: z.string().min(1).max(500),
        whyVi: z.string().min(1).max(500),
      }),
    )
    .min(1)
    .max(5),
  ieltsTipEn: z.string().min(1).max(500),
  ieltsTipVi: z.string().min(1).max(500),
})

export type GrammarLesson = z.infer<typeof lessonSchema>
export { lessonSchema as grammarLessonSchema }

export const grammarTopicSourceSchema = z
  .object({
    slug: z
      .string()
      .max(60)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slugs use lower-case words joined by hyphens"),
    title: z.string().min(1).max(120),
    summary: z.string().min(1).max(500),
    level: z.enum(CONTENT_LEVELS),
    source: z.enum(CONTENT_SOURCES),
    reviewStatus: z.enum(REVIEW_STATUSES),
    version: z.int().min(1).default(1),
    position: z.int().min(1).max(100),
    lesson: lessonSchema,
    /** Only the question groups; the rest of the practice set comes from the topic. */
    practice: z.strictObject({ groups: z.array(z.unknown()).min(1) }),
  })
  .transform((topic, context): Omit<typeof topic, "practice"> & { practice: PracticeSetSource } => {
    // Grammar practice is learn mode only (no time limit) and has no passage.
    const practice = practiceSetSourceSchema.safeParse({
      slug: `${topic.slug}-practice`,
      title: `${topic.title} — practice`,
      level: topic.level,
      topics: [],
      source: topic.source,
      reviewStatus: topic.reviewStatus,
      version: topic.version,
      module: "grammar",
      groups: topic.practice.groups,
    })
    if (!practice.success) {
      for (const issue of practice.error.issues) {
        context.addIssue({
          code: "custom",
          message: issue.message,
          path: ["practice", ...issue.path],
        })
      }
      return z.NEVER
    }
    return { ...topic, practice: practice.data }
  })

export type GrammarTopicSource = z.output<typeof grammarTopicSourceSchema>
