import type { AnswerOption } from "@/lib/content/practice-set-schema"

export type Answers = Readonly<Record<string, readonly string[]>>

/** True when the learner has given an answer (a choice or non-blank text). */
export function isAnswered(response: readonly string[] | undefined): boolean {
  return !!response && response.some((value) => value.trim().length > 0)
}

type CountedQuestion = { id: string; selectCount: number | null }

/** Questions in IELTS terms: a "choose TWO" question counts as two (one per mark). */
export function markCount(questions: readonly CountedQuestion[]): number {
  return questions.reduce((total, question) => total + (question.selectCount ?? 1), 0)
}

/** Answered questions in IELTS terms: each choice made in a multi-answer question counts. */
export function countAnswered(questions: readonly CountedQuestion[], answers: Answers): number {
  return questions.reduce((total, question) => {
    const response = answers[question.id]
    if (!isAnswered(response)) return total
    return total + Math.min(response?.length ?? 0, question.selectCount ?? 1)
  }, 0)
}

/** The number(s) a question occupies: "23–24" for a "choose TWO" question at 23. */
export function questionNumbers(question: { number: number; selectCount: number | null }): string {
  const count = question.selectCount ?? 1
  return count > 1 ? `${question.number}–${question.number + count - 1}` : String(question.number)
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
