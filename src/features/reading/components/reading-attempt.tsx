import { notFound, redirect } from "next/navigation"

import { AttemptRunner } from "@/features/practice"
import { getAttempt, getPracticeSetBySlug, submitAttempt } from "@/server/practice/practice-service"

import { readingAttemptParamsSchema, readingReviewHref, readingSetHref } from "../routes"

type ReadingAttemptProps = { params: Promise<{ setSlug: string; attemptId: string }> }

/** An attempt in focus mode (READ-03). Closed attempts go to their results. */
export async function ReadingAttempt({ params }: ReadingAttemptProps) {
  const parsed = readingAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { setSlug, attemptId } = parsed.data

  const [set, attempt] = await Promise.all([
    getPracticeSetBySlug("reading", setSlug),
    getAttempt(attemptId),
  ])
  // RLS hides other learners' attempts, so "not yours" and "does not exist" both end here.
  if (!set || !attempt || attempt.practiceSetId !== set.id) notFound()

  const reviewHref = readingReviewHref(set.slug, attempt.id)
  if (attempt.status === "submitted") redirect(reviewHref)

  if (attempt.remainingMs === 0) {
    // Time ran out while the learner was away: the server submits the saved answers.
    const result = await submitAttempt(attempt.id)
    if (!result.ok) throw new Error("Could not submit the expired attempt.")
    redirect(reviewHref)
  }

  return (
    <AttemptRunner
      set={set}
      attempt={{ id: attempt.id, mode: attempt.mode, answers: attempt.answers }}
      initialRemainingMs={attempt.remainingMs}
      exitHref={readingSetHref(set.slug)}
      reviewHref={reviewHref}
    />
  )
}
