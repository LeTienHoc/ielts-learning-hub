// Turns validated practice-set sources into SQL for supabase/seed.sql.
// Pure functions (no file access) so they can be unit tested; see build-content-seed.mts.

import { createHash } from "node:crypto"

import {
  DEFAULT_TYPE_OPTIONS,
  QUESTION_TYPE_RESPONSE_KIND,
  type PracticeSetSource,
} from "../src/lib/content/practice-set-schema.ts"

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

      statements.push(
        `insert into public.questions (id, practice_set_id, group_id, position, number, prompt, options, response_kind, select_count, max_words)
values (${[
          sql(questionId),
          sql(setId),
          sql(groupId),
          sql(questionIndex + 1),
          sql(question.number),
          sql(question.prompt),
          question.options ? json(question.options) : "null",
          sql(kind),
          sql(kind === "multiple" ? question.accepted.length : null),
          sql(question.maxWords),
        ].join(", ")});`,
        `insert into public.question_keys (question_id, accepted, explanation, explanation_vi, evidence_start, evidence_end)
values (${[
          sql(questionId),
          json(question.accepted),
          sql(question.explanation),
          sql(question.explanationVi),
          sql(evidence?.start),
          sql(evidence?.end),
        ].join(", ")});`,
      )
    })
  })

  return statements.join("\n")
}

/** The whole seed file: a header and one block per set, ordered by slug for stable diffs. */
export function buildSeedSql(sets: readonly PracticeSetSource[]): string {
  const slugs = sets.map((set) => set.slug)
  const duplicate = slugs.find((slug, index) => slugs.indexOf(slug) !== index)
  if (duplicate) throw new Error(`Duplicate practice set slug: ${duplicate}`)

  const blocks = [...sets]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((set) => buildPracticeSetSql(set))

  const header = [
    "-- GENERATED by `pnpm content:seed` from content/practice-sets/*.json. Do not edit by hand.",
    "-- Loaded into the LOCAL database by `pnpm db:reset`; not applied to production.",
    "begin;",
  ].join("\n")
  return `${[header, ...blocks, "commit;"].join("\n\n")}\n`
}
