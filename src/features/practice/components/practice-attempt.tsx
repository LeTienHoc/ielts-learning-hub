import { notFound, redirect } from "next/navigation"

import { AddToMyWordsButton } from "@/features/vocabulary"
import type { PracticeModule } from "@/lib/content/practice-set-schema"
import { requireUser } from "@/server/auth/session"
import { getAttempt, getPracticeSetBySlug, submitAttempt } from "@/server/practice/practice-service"

import { checkAnswerAction } from "../actions"
import { AttemptRunner } from "./attempt-runner"

type PracticeAttemptProps = {
  module: PracticeModule
  setSlug: string
  attemptId: string
  exitHref: string
  reviewHref: string
  /** Learn mode with a Check button per question (grammar). */
  withInstantCheck?: boolean
}

/**
 * Loads an attempt for focus mode. Closed attempts go to their results; an attempt whose
 * deadline passed while the learner was away is submitted by the server first.
 * Reads the session: render inside <Suspense> (the (focus) loading boundary).
 */
export async function PracticeAttempt({
  module,
  setSlug,
  attemptId,
  exitHref,
  reviewHref,
  withInstantCheck = false,
}: PracticeAttemptProps) {
  const [user, set, attempt] = await Promise.all([
    requireUser(),
    getPracticeSetBySlug(module, setSlug),
    getAttempt(attemptId),
  ])
  // RLS hides other learners' attempts, so "not yours" and "does not exist" both end here.
  if (!set || !attempt || attempt.practiceSetId !== set.id) notFound()
  if (attempt.status === "submitted") redirect(reviewHref)

  if (attempt.remainingMs === 0) {
    const result = await submitAttempt(attempt.id)
    if (!result.ok) throw new Error("Could not submit the expired attempt.")
    redirect(reviewHref)
  }

  const keyWordActions = Object.fromEntries(
    set.passages.flatMap((passage) =>
      passage.keyWords.map((keyWord) => [
        keyWord.wordId,
        <AddToMyWordsButton
          key={keyWord.wordId}
          kind="word"
          id={keyWord.wordId}
          isAdded={keyWord.inMyWords}
        />,
      ]),
    ),
  )

  return (
    <AttemptRunner
      set={set}
      attempt={{
        id: attempt.id,
        mode: attempt.mode,
        answers: attempt.answers,
        answersSavedAt: attempt.answersSavedAt,
      }}
      initialRemainingMs={attempt.remainingMs}
      exitHref={exitHref}
      reviewHref={reviewHref}
      instantCheck={withInstantCheck ? checkAnswerAction : undefined}
      initialChecked={withInstantCheck ? attempt.results : undefined}
      language={user.explanationLanguage}
      keyWordActions={keyWordActions}
    />
  )
}
