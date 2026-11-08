// Turns validated content sources (practice sets, vocabulary sets, grammar topics) into SQL for
// supabase/seed.sql.
// Pure functions (no file access) so they can be unit tested; see build-content-seed.mts.

import { createHash } from "node:crypto"

import {
  DEFAULT_TYPE_OPTIONS,
  QUESTION_TYPE_RESPONSE_KIND,
  tokenizeSentence,
  type PracticeSetSource,
} from "../src/lib/content/practice-set-schema.ts"
import type { GrammarTopicSource } from "../src/lib/content/grammar-schema.ts"
import type { VocabularySetSource, WordSource } from "../src/lib/content/vocabulary-schema.ts"

/**
 * Stable UUID (version 5 layout, SHA-1) for a content name, so regenerated seeds keep ids and
 * re-importing the same content updates rather than duplicates it.
 */
export function contentUuid(name: string): string {
  const bytes = createHash("sha1").update(`ielts-learning-hub:${name}`).digest().subarray(0, 16)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** SQL literal: NULL, a number, a text[] or a quoted string with quotes doubled. */
export function sql(value: string | number | null | undefined | readonly string[]): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new Error(`Only integers are supported, got ${value}`)
    return String(value)
  }
  if (Array.isArray(value)) return `array[${value.map((item) => sql(item)).join(", ")}]::text[]`
  return `'${String(value).replaceAll("'", "''")}'`
}

const json = (value: unknown) => `${sql(JSON.stringify(value))}::jsonb`

/**
 * Finds the evidence quote in the passage; it must occur exactly once. Offsets are JavaScript
 * string (UTF-16) indices, matching how the app slices the passage.
 */
export function locateEvidence(passage: string, quote: string): { start: number; end: number } {
  const start = passage.indexOf(quote)
  if (start === -1) throw new Error(`Evidence not found in passage: "${quote.slice(0, 60)}"`)
  if (passage.indexOf(quote, start + 1) !== -1) {
    throw new Error(`Evidence occurs more than once in passage: "${quote.slice(0, 60)}"`)
  }
  return { start, end: start + quote.length }
}

/** SQL statements that insert one practice set with its groups, questions and answer keys. */
export function buildPracticeSetSql(set: PracticeSetSource): string {
  const setId = contentUuid(`practice-set:${set.slug}`)
  const statements: string[] = [
    `-- ${set.slug} (${set.reviewStatus}, v${set.version})`,
    `insert into public.content_items (id, type, slug, title, summary, level, topics, source, review_status, version)
values (${[
      sql(setId),
      sql("practice_set"),
      sql(set.slug),
      sql(set.title),
      sql(set.summary),
      sql(set.level),
      sql(set.topics),
      sql(set.source),
      sql(set.reviewStatus),
      sql(set.version),
    ].join(", ")});`,
    `insert into public.practice_sets (id, module, test_time_limit_seconds, passage_title, passage_text)
values (${[
      sql(setId),
      sql(set.module),
      sql(set.testTimeLimitMinutes === undefined ? null : set.testTimeLimitMinutes * 60),
      sql(set.passage?.title),
      sql(set.passage?.text),
    ].join(", ")});`,
  ]

  set.groups.forEach((group, groupIndex) => {
    const groupId = contentUuid(`practice-set:${set.slug}:group:${groupIndex + 1}`)
    const kind = QUESTION_TYPE_RESPONSE_KIND[group.type]
    const groupOptions =
      group.options ?? (kind === "text" ? undefined : DEFAULT_TYPE_OPTIONS[group.type])

    statements.push(
      `insert into public.question_groups (id, practice_set_id, position, question_type, instructions, options)
values (${[
        sql(groupId),
        sql(setId),
        sql(groupIndex + 1),
        sql(group.type),
        sql(group.instructions),
        groupOptions ? json(groupOptions) : "null",
      ].join(", ")});`,
    )

    group.questions.forEach((question, questionIndex) => {
      const questionId = contentUuid(`practice-set:${set.slug}:question:${question.number}`)
      const evidence =
        question.evidence && set.passage
          ? locateEvidence(set.passage.text, question.evidence)
          : undefined
      // Spot the mistake: the words of the sentence are the options; the key is the wrong word.
      const tokens =
        group.type === "error_correction" ? tokenizeSentence(question.prompt) : undefined
      const options = tokens ? tokens.map(({ id, text }) => ({ id, text })) : question.options
      const accepted = tokens
        ? tokens
            .filter((token) => token.word === question.accepted[0]?.toLowerCase())
            .map((token) => token.id)
        : question.accepted

      statements.push(
        `insert into public.questions (id, practice_set_id, group_id, position, number, prompt, options, response_kind, select_count, max_words)
values (${[
          sql(questionId),
          sql(setId),
          sql(groupId),
          sql(questionIndex + 1),
          sql(question.number),
          sql(question.prompt),
          options ? json(options) : "null",
          sql(kind),
          sql(kind === "multiple" ? question.accepted.length : null),
          sql(question.maxWords),
        ].join(", ")});`,
        `insert into public.question_keys (question_id, accepted, explanation, explanation_vi, evidence_start, evidence_end, correction)
values (${[
          sql(questionId),
          json(accepted),
          sql(question.explanation),
          sql(question.explanationVi),
          sql(evidence?.start),
          sql(evidence?.end),
          sql(question.correction),
        ].join(", ")});`,
      )
    })
  })

  return statements.join("\n")
}

/** A catalogue row shared by every content type. */
function contentItemSql(
  id: string,
  type: "practice_set" | "vocabulary_set" | "grammar_topic",
  item: {
    slug: string
    title: string
    summary?: string | undefined
    level: string
    topics?: readonly string[]
    source: string
    reviewStatus: string
    version: number
  },
): string {
  return `insert into public.content_items (id, type, slug, title, summary, level, topics, source, review_status, version)
values (${[
    sql(id),
    sql(type),
    sql(item.slug),
    sql(item.title),
    sql(item.summary),
    sql(item.level),
    sql(item.topics ?? []),
    sql(item.source),
    sql(item.reviewStatus),
    sql(item.version),
  ].join(", ")});`
}

/** One word (shared by every set that lists it). */
export function buildWordSql(word: WordSource): string {
  return `insert into public.words (id, slug, lemma, part_of_speech, ipa, meaning_en, meaning_vi, examples, collocations, common_mistakes, level, topics)
values (${[
    sql(contentUuid(`word:${word.slug}`)),
    sql(word.slug),
    sql(word.lemma),
    sql(word.partOfSpeech),
    sql(word.ipa),
    sql(word.meaningEn),
    sql(word.meaningVi),
    json(word.examples),
    json(word.collocations),
    json(word.commonMistakes),
    sql(word.level),
    sql(word.topics),
  ].join(", ")});`
}

/** A vocabulary set and the ordered links to its words (the words are inserted separately). */
export function buildVocabularySetSql(set: VocabularySetSource): string {
  const setId = contentUuid(`vocabulary-set:${set.slug}`)
  return [
    `-- vocabulary set ${set.slug} (${set.reviewStatus}, v${set.version})`,
    contentItemSql(setId, "vocabulary_set", set),
    `insert into public.vocabulary_sets (id) values (${sql(setId)});`,
    ...set.words.map(
      (word, index) =>
        `insert into public.vocabulary_set_words (set_id, word_id, position) values (${sql(setId)}, ${sql(contentUuid(`word:${word.slug}`))}, ${index + 1});`,
    ),
  ].join("\n")
}

/** A grammar topic: its catalogue row, its learn-mode practice set and the lesson. */
export function buildGrammarTopicSql(topic: GrammarTopicSource): string {
  const topicId = contentUuid(`grammar-topic:${topic.slug}`)
  return [
    `-- grammar topic ${topic.slug} (${topic.reviewStatus}, v${topic.version})`,
    contentItemSql(topicId, "grammar_topic", topic),
    buildPracticeSetSql(topic.practice),
    `insert into public.grammar_topics (id, position, lesson, practice_set_id)
values (${[
      sql(topicId),
      sql(topic.position),
      json(topic.lesson),
      sql(contentUuid(`practice-set:${topic.practice.slug}`)),
    ].join(", ")});`,
  ].join("\n")
}

const sameDefinition = (a: WordSource, b: WordSource) => JSON.stringify(a) === JSON.stringify(b)

/** The whole seed file in one transaction, ordered by slug for stable diffs. */
export function buildSeedSql(input: {
  practiceSets: readonly PracticeSetSource[]
  vocabularySets: readonly VocabularySetSource[]
  grammarTopics: readonly GrammarTopicSource[]
}): string {
  const practiceSlugs = [
    ...input.practiceSets.map((set) => set.slug),
    ...input.grammarTopics.map((topic) => topic.practice.slug),
  ]
  const duplicate = practiceSlugs.find((slug, index) => practiceSlugs.indexOf(slug) !== index)
  if (duplicate) throw new Error(`Duplicate practice set slug: ${duplicate}`)

  // A word may appear in several sets; it is inserted once and must be defined identically.
  const words = new Map<string, WordSource>()
  for (const set of input.vocabularySets) {
    for (const word of set.words) {
      const existing = words.get(word.slug)
      if (existing && !sameDefinition(existing, word)) {
        throw new Error(`Conflicting definitions for word "${word.slug}"`)
      }
      words.set(word.slug, word)
    }
  }

  const bySlug = <T extends { slug: string }>(items: readonly T[]) =>
    [...items].sort((a, b) => a.slug.localeCompare(b.slug))

  const blocks = [
    ...bySlug(input.practiceSets).map((set) => buildPracticeSetSql(set)),
    ...bySlug([...words.values()]).map((word) => buildWordSql(word)),
    ...bySlug(input.vocabularySets).map((set) => buildVocabularySetSql(set)),
    ...bySlug(input.grammarTopics).map((topic) => buildGrammarTopicSql(topic)),
  ]

  const header = [
    "-- GENERATED by `pnpm content:seed` from content/{practice-sets,vocabulary-sets,grammar-topics}.",
    "-- Do not edit by hand. Loaded into the LOCAL database by `pnpm db:reset`; not applied to production.",
    "begin;",
  ].join("\n")
  return `${[header, ...blocks, "commit;"].join("\n\n")}\n`
}
