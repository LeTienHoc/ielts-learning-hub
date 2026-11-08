import type { AnswerOption } from "@/lib/content/practice-set-schema"

export type Answers = Readonly<Record<string, readonly string[]>>

/** True when the learner has given an answer (a choice or non-blank text). */
export function isAnswered(response: readonly string[] | undefined): boolean {
  return !!response && response.some((value) => value.trim().length > 0)
}

export function countAnswered(questionIds: readonly string[], answers: Answers): number {
  return questionIds.filter((id) => isAnswered(answers[id])).length
}

/** "mm:ss", or "h:mm:ss" from one hour. Negative values show as 0:00. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, "0")
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`
}

/** True when the option's text just spells out its id (e.g. NOT_GIVEN → "NOT GIVEN"). */
export function isSelfLabelled(option: AnswerOption): boolean {
  return option.id.replaceAll("_", " ").toLowerCase() === option.text.toLowerCase()
}

/** Readable text for a response: lettered options become "id — text"; text answers stay as typed. */
export function describeResponse(
  response: readonly string[] | undefined,
  options: readonly AnswerOption[],
): string | null {
  if (!isAnswered(response)) return null
  return (response ?? [])
    .map((value) => {
      const option = options.find((candidate) => candidate.id === value)
      if (!option) return value
      return isSelfLabelled(option) ? option.text : `${option.id} — ${option.text}`
    })
    .join(", ")
}

/** Passage paragraphs, split on blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** The passage text an answer key points to, if the range is valid. */
export function evidenceExcerpt(
  passage: string,
  range: { start: number; end: number } | null,
): string | null {
  if (!range || range.start < 0 || range.end > passage.length || range.end <= range.start) {
    return null
  }
  return passage.slice(range.start, range.end)
}
