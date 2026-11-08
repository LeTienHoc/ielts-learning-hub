"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef, useState, useTransition } from "react"

import { FocusShell } from "@/components/layout/focus-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { saveAnswerAction, submitAttemptAction } from "../actions"
import { useAttemptAnswers } from "../hooks/use-attempt-answers"
import type { AttemptMode, PracticeSetDetail } from "../types"
import { countAnswered, type Answers } from "../utils/answers"
import { AttemptTimer } from "./attempt-timer"
import { PassageView } from "./passage-view"
import { QuestionInput } from "./question-input"
import { SaveStatus } from "./save-status"

type AttemptRunnerProps = {
  set: PracticeSetDetail
  attempt: { id: string; mode: AttemptMode; answers: Answers }
  /** Test mode: time left when the page was rendered. Null in learn mode. */
  initialRemainingMs: number | null
  exitHref: string
  reviewHref: string
}

/** Runs a practice attempt in focus mode: passage, questions, autosave, timer and submit. */
export function AttemptRunner({
  set,
  attempt,
  initialRemainingMs,
  exitHref,
  reviewHref,
}: AttemptRunnerProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, startSubmitting] = useTransition()
  const isFinishing = useRef(false)

  const finish = useCallback(async () => {
    if (isFinishing.current) return
    isFinishing.current = true
    const result = await submitAttemptAction(attempt.id)
    if (!result.ok) {
      isFinishing.current = false
      setSubmitError(result.error)
      return
    }
    router.replace(reviewHref)
  }, [attempt.id, reviewHref, router])

  const { answers, setAnswer, flush, status } = useAttemptAnswers({
    attemptId: attempt.id,
    initialAnswers: attempt.answers,
    saveAnswer: saveAnswerAction,
    // Closed on the server (time is up or submitted elsewhere): show the results.
    onClosed: () => startSubmitting(finish),
  })

  const submit = () =>
    startSubmitting(async () => {
      setSubmitError(null)
      const outcome = await flush()
      if (outcome === "pending") {
        setSubmitError("Some answers are not saved yet. Check your connection and try again.")
        return
      }
      // "closed" is handled by onClosed, which submits and opens the results.
      if (outcome === "saved") await finish()
    })

  // Time is up: save what is pending (the server allows a short grace period), then submit.
  const expire = () =>
    startSubmitting(async () => {
      await flush()
      await finish()
    })

  const questionIds = set.groups.flatMap((group) => group.questions.map((question) => question.id))
  const answeredCount = countAnswered(questionIds, answers)
  const unansweredCount = questionIds.length - answeredCount

  return (
    <FocusShell
      title={set.title}
      exitHref={exitHref}
      status={
        initialRemainingMs === null ? (
          <Badge variant="secondary">Learn mode</Badge>
        ) : (
          <AttemptTimer initialRemainingMs={initialRemainingMs} onExpire={expire} />
        )
      }
      footer={
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-label text-foreground">
              {answeredCount} of {questionIds.length} answered
            </p>
            <SaveStatus status={status} />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit your answers?</DialogTitle>
                <DialogDescription>
                  {unansweredCount > 0
                    ? `You have ${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"}. They will be marked as incorrect.`
                    : "You have answered every question. You cannot change answers after submitting."}
                </DialogDescription>
              </DialogHeader>
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep working</Button>
                </DialogClose>
                <Button onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Submit answers"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className={set.passage ? "grid gap-8 lg:grid-cols-2" : "mx-auto max-w-3xl"}>
        {set.passage && (
          // Desktop: the passage stays in view while the questions scroll (below header,
          // above the sticky footer). No token covers this viewport-relative height.
          <div className="rounded-card border border-border bg-background p-5 lg:sticky lg:top-20 lg:max-h-[calc(100svh-11rem)] lg:overflow-y-auto">
            <PassageView title={set.passage.title} text={set.passage.text} />
          </div>
        )}
        <div className="flex flex-col gap-8">
          {set.groups.map((group) => (
            <section
              key={group.id}
              aria-label={`Questions ${group.questions[0]?.number ?? ""}–${group.questions.at(-1)?.number ?? ""}`}
              className="flex flex-col gap-5 rounded-card border border-border bg-background p-5"
            >
              <p className="text-body-sm text-muted-foreground">{group.instructions}</p>
              {group.type.startsWith("matching_") && group.sharedOptions.length > 0 && (
                <ul aria-label="Options" className="flex flex-col gap-1 rounded-md bg-muted p-3">
                  {group.sharedOptions.map((option) => (
                    <li key={option.id} className="text-body-sm text-foreground">
                      <span className="mr-2 font-semibold">{option.id}</span>
                      {option.text}
                    </li>
                  ))}
                </ul>
              )}
              {group.questions.map((question) => (
                <QuestionInput
                  key={question.id}
                  question={question}
                  groupType={group.type}
                  response={answers[question.id] ?? []}
                  onChange={(response, debounceMs) => setAnswer(question.id, response, debounceMs)}
                  disabled={isSubmitting}
                />
              ))}
            </section>
          ))}
        </div>
      </div>
      {submitError && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
    </FocusShell>
  )
}
