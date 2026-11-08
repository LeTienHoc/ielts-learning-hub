"use client"

import { CircleCheck, CircleMinus, CircleX, TextSearch } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { bandEstimate } from "@/lib/learning/reading-band"

import type { AnswerKey, AttemptState, PracticeQuestion, PracticeSetDetail } from "../types"
import {
  describeResponse,
  evidenceExcerpt,
  isAnswered,
  markCount,
  questionNumbers,
} from "../utils/answers"
import { PassagePanel, type PassageEvidence } from "./passage-panel"

type AttemptReviewProps = {
  set: PracticeSetDetail
  attempt: AttemptState
  keys: Readonly<Record<string, AnswerKey>>
  explanationLanguage: "en" | "vi"
  /** Next steps, e.g. "Try again" and "Back to Reading". */
  actions?: ReactNode
  /** "Add to My words" buttons for passage key words, by word id (rendered on the server). */
  keyWordActions?: Readonly<Record<string, ReactNode>>
}

export const BAND_NOTE =
  "Estimate based on the commonly published IELTS Academic Reading conversion — not an official score."

type Outcome = "correct" | "partial" | "incorrect" | "unanswered"

const OUTCOME = {
  correct: { label: "Correct", variant: "success", icon: CircleCheck },
  partial: { label: "Partly correct", variant: "warning", icon: CircleMinus },
  incorrect: { label: "Incorrect", variant: "destructive", icon: CircleX },
  unanswered: { label: "Not answered", variant: "secondary", icon: CircleMinus },
} as const satisfies Record<Outcome, object>

function outcomeOf(question: PracticeQuestion, attempt: AttemptState): Outcome {
  if (!isAnswered(attempt.answers[question.id])) return "unanswered"
  const result = attempt.results[question.id]
  if (result?.isCorrect) return "correct"
  return result && result.points > 0 ? "partial" : "incorrect"
}

/** Results of a submitted attempt: score summary, then each answer with its explanation. */
export function AttemptReview({
  set,
  attempt,
  keys,
  explanationLanguage,
  actions,
  keyWordActions,
}: AttemptReviewProps) {
  const [evidence, setEvidence] = useState<PassageEvidence | null>(null)
  const passageRef = useRef<HTMLDivElement>(null)
  // Bring the evidence into view each time an answer asks for it.
  useEffect(() => {
    if (!evidence) return
    passageRef.current?.querySelector("mark[data-evidence]")?.scrollIntoView({ block: "center" })
  }, [evidence])

  const questions = set.groups.flatMap((group) => group.questions)
  // Evidence offsets are relative to the passage of the question's group.
  const passageOfQuestion = new Map(
    set.groups.flatMap((group) => {
      const passage = set.passages.find((candidate) => candidate.id === group.passageId)
      return passage ? group.questions.map((question) => [question.id, passage] as const) : []
    }),
  )
  // "Spot the mistake" options are the sentence's words: show the word, not its id.
  const spotIds = new Set(
    set.groups
      .filter((group) => group.type === "error_correction")
      .flatMap((group) => group.questions.map((question) => question.id)),
  )
  const wordsOf = (question: PracticeQuestion, response: readonly string[] | undefined) =>
    isAnswered(response)
      ? (response ?? [])
          .map((id) => question.options.find((option) => option.id === id)?.text ?? id)
          .join(", ")
      : null
  const score = attempt.score ?? 0
  const maxScore = attempt.maxScore ?? 0
  const band = bandEstimate(set.kind, score, maxScore)
  const hasPassage = set.passages.length > 0

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Your score</CardDescription>
          <CardTitle className="text-h2">
            {score} / {maxScore}
          </CardTitle>
          {band !== null && (
            <p className="text-h4 text-primary-subtle-foreground">Estimated band {band}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-body text-foreground">
            {markCount(questions)} questions ·{" "}
            {attempt.mode === "test" ? "Test mode" : "Learn mode"}
          </p>
          {attempt.submitReason === "time_expired" && (
            <p className="text-body-sm text-warning-emphasis">
              Time ran out, so your answers were submitted automatically.
            </p>
          )}
          <p className="text-caption text-muted-foreground">
            {band !== null ? BAND_NOTE : "This is a practice score, not an IELTS band score."}
          </p>
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </CardContent>
      </Card>

      <div className={hasPassage ? "grid items-start gap-6 lg:grid-cols-2" : undefined}>
        {hasPassage && (
          // The passage scrolls on its own so answers stay reachable; no token covers these
          // viewport-relative heights (below the header on desktop).
          <div
            ref={passageRef}
            className="max-h-[60svh] overflow-y-auto rounded-card border border-border bg-background p-5 lg:sticky lg:top-20 lg:max-h-[calc(100svh-7rem)]"
          >
            <PassagePanel
              passages={set.passages}
              language={explanationLanguage}
              evidence={evidence}
              keyWordActions={keyWordActions}
            />
          </div>
        )}
        <ol aria-label="Answers and explanations" className="flex flex-col gap-4">
          {questions.map((question) => {
            const key = keys[question.id]
            const outcome = OUTCOME[outcomeOf(question, attempt)]
            const isSpot = spotIds.has(question.id)
            const yourAnswer = isSpot
              ? wordsOf(question, attempt.answers[question.id])
              : describeResponse(attempt.answers[question.id], question.options)
            const correctAnswer = !key
              ? null
              : isSpot
                ? [wordsOf(question, key.accepted), key.correction].filter(Boolean).join(" → ")
                : question.responseKind === "text"
                  ? key.accepted.join(" / ")
                  : describeResponse(key.accepted, question.options)
            const explanation =
              key && explanationLanguage === "vi" && key.explanationVi
                ? key.explanationVi
                : key?.explanation
            const passage = passageOfQuestion.get(question.id)
            const evidenceRange = key?.evidence ?? null
            const evidence = passage ? evidenceExcerpt(passage.text, evidenceRange) : null

            return (
              <li key={question.id}>
                <Card>
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-h4">
                      <h2>
                        {(question.selectCount ?? 1) > 1 ? "Questions" : "Question"}{" "}
                        {questionNumbers(question)}
                      </h2>
                    </CardTitle>
                    <Badge variant={outcome.variant}>
                      <outcome.icon aria-hidden="true" />
                      {outcome.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-body text-foreground">{question.prompt}</p>
                    <dl className="grid gap-1 text-body-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
                      <dt className="text-muted-foreground">Your answer</dt>
                      <dd className="text-foreground">{yourAnswer ?? "—"}</dd>
                      <dt className="text-muted-foreground">Correct answer</dt>
                      <dd className="font-semibold text-foreground">{correctAnswer ?? "—"}</dd>
                    </dl>
                    {explanation && (
                      <p
                        className="text-body text-foreground"
                        lang={explanation === key?.explanationVi ? "vi" : "en"}
                      >
                        {explanation}
                      </p>
                    )}
                    {evidence && (
                      <figure className="flex flex-col gap-1 border-l-2 border-primary pl-3">
                        <figcaption className="text-caption text-muted-foreground">
                          From the passage
                        </figcaption>
                        <blockquote className="text-body-sm text-foreground italic">
                          “{evidence}”
                        </blockquote>
                        {passage && evidenceRange && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 self-start"
                            onClick={() =>
                              setEvidence({ passageId: passage.id, range: { ...evidenceRange } })
                            }
                          >
                            <TextSearch aria-hidden="true" />
                            Show in passage
                          </Button>
                        )}
                      </figure>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
