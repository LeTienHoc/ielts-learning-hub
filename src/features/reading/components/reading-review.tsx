import { notFound } from "next/navigation"

import { PracticeResults } from "@/features/practice"

import { readingAttemptHref, readingAttemptParamsSchema, readingAttemptsHref } from "../routes"

type ReadingReviewProps = { params: Promise<{ setSlug: string; attemptId: string }> }

/** Results and explanations of a submitted Reading attempt (READ-04). */
export async function ReadingReview({ params }: ReadingReviewProps) {
  const parsed = readingAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { setSlug, attemptId } = parsed.data

  return (
    <PracticeResults
      module="reading"
      setSlug={setSlug}
      attemptId={attemptId}
      attemptHref={readingAttemptHref(setSlug, attemptId)}
      attemptsHrefPrefix={readingAttemptsHref(setSlug)}
      back={{ href: "/reading", label: "Reading" }}
    />
  )
}
