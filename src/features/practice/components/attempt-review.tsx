import { CircleCheck, CircleMinus, CircleX } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import type { AnswerKey, AttemptState, PracticeQuestion, PracticeSetDetail } from "../types"
import { describeResponse, evidenceExcerpt, isAnswered } from "../utils/answers"

type AttemptReviewProps = {
  set: PracticeSetDetail
  attempt: AttemptState
  keys: Readonly<Record<string, AnswerKey>>
  explanationLanguage: "en" | "vi"
  /** Next steps, e.g. "Try again" and "Back to Reading". */
  actions?: ReactNode
}

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
}: AttemptReviewProps) {
  const questions = set.groups.flatMap((group) => group.questions)
  const correctCount = questions.filter(
    (question) => outcomeOf(question, attempt) === "correct",
  ).length

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Your score</CardDescription>
          <CardTitle className="text-h2">
            {attempt.score ?? 0} / {attempt.maxScore ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-body text-foreground">
            {correctCount} of {questions.length} questions fully correct ·{" "}
            {attempt.mode === "test" ? "Test mode" : "Learn mode"}
          </p>
          {attempt.submitReason === "time_expired" && (
            <p className="text-body-sm text-warning-emphasis">
              Time ran out, so your answers were submitted automatically.
            </p>
          )}
          <p className="text-caption text-muted-foreground">
            This is a practice score, not an IELTS band score.
          </p>
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </CardContent>
      </Card>

      <ol aria-label="Answers and explanations" className="flex flex-col gap-4">
        {questions.map((question) => {
          const key = keys[question.id]
          const outcome = OUTCOME[outcomeOf(question, attempt)]
          const yourAnswer = describeResponse(attempt.answers[question.id], question.options)
          const correctAnswer = key
            ? question.responseKind === "text"
              ? key.accepted.join(" / ")
              : describeResponse(key.accepted, question.options)
            : null
          const explanation =
            key && explanationLanguage === "vi" && key.explanationVi
              ? key.explanationVi
              : key?.explanation
          const evidence =
            key && set.passage ? evidenceExcerpt(set.passage.text, key.evidence) : null

          return (
            <li key={question.id}>
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-h4">
                    <h2>Question {question.number}</h2>
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
                    </figure>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
