import { z } from "zod"

// Authoring format for vocabulary sets (content/vocabulary-sets/*.json). Mirrors
// supabase/migrations/20261109110000_vocabulary_srs.sql. Imported by Node scripts, so it may
// only import external packages and sibling files with their `.ts` extension.
import {
  CONTENT_LEVELS,
  CONTENT_SOURCES,
  CONTENT_TOPICS,
  REVIEW_STATUSES,
} from "./practice-set-schema.ts"

const slugSchema = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slugs use lower-case words joined by hyphens")

const mistakeSchema = z.object({
  wrong: z.string().min(1).max(200),
  right: z.string().min(1).max(200),
  whyEn: z.string().min(1).max(500),
  whyVi: z.string().min(1).max(500),
})

export const wordSourceSchema = z
  .object({
    /** Unique across all sets: the lemma, or lemma-pos when needed (e.g. address-verb). */
    slug: slugSchema,
    lemma: z.string().min(1).max(80),
    partOfSpeech: z.string().min(1).max(30),
    ipa: z.string().min(1).max(80),
    meaningEn: z.string().min(1).max(500),
    meaningVi: z.string().min(1).max(500),
    examples: z
      .array(
        z.object({
          en: z.string().min(1).max(300),
          vi: z.string().min(1).max(300),
          /** The exact form of the word in `en`, blanked out in "Save the sentence". */
          cloze: z.string().min(1).max(80),
        }),
      )
      .min(1)
      .max(3),
    collocations: z.array(z.string().min(1).max(80)).max(6),
    commonMistakes: z.array(mistakeSchema).max(3),
    level: z.enum(CONTENT_LEVELS),
    topics: z.array(z.enum(CONTENT_TOPICS)).min(1).max(3),
  })
  .superRefine((word, context) => {
    word.examples.forEach((example, index) => {
      if (example.en.split(example.cloze).length !== 2) {
        context.addIssue({
          code: "custom",
          message: `Example ${index + 1} of "${word.slug}": cloze must appear once in the sentence`,
        })
      }
    })
  })

export type WordSource = z.infer<typeof wordSourceSchema>
export type WordMistake = z.infer<typeof mistakeSchema>

export const vocabularySetSourceSchema = z
  .object({
    slug: slugSchema,
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(500).optional(),
    level: z.enum(CONTENT_LEVELS),
    topics: z.array(z.enum(CONTENT_TOPICS)).max(5).default([]),
    source: z.enum(CONTENT_SOURCES),
    reviewStatus: z.enum(REVIEW_STATUSES),
    version: z.int().min(1).default(1),
    words: z.array(wordSourceSchema).min(1).max(30),
  })
  .superRefine((set, context) => {
    const seen = new Set<string>()
    for (const word of set.words) {
      if (seen.has(word.slug)) {
        context.addIssue({
          code: "custom",
          message: `Word "${word.slug}" appears twice in the set`,
        })
      }
      seen.add(word.slug)
    }
  })

export type VocabularySetSource = z.infer<typeof vocabularySetSourceSchema>
