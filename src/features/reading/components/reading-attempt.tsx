import { notFound } from "next/navigation"

import { PracticeAttempt } from "@/features/practice"

import { readingAttemptParamsSchema, readingReviewHref, readingSetHref } from "../routes"

type ReadingAttemptProps = { params: Promise<{ setSlug: string; attemptId: string }> }

/** A Reading attempt in focus mode (READ-03). */
export async function ReadingAttempt({ params }: ReadingAttemptProps) {
  const parsed = readingAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { setSlug, attemptId } = parsed.data

  return (
    <PracticeAttempt
      module="reading"
      setSlug={setSlug}
      attemptId={attemptId}
      exitHref={readingSetHref(setSlug)}
      reviewHref={readingReviewHref(setSlug, attemptId)}
    />
  )
}
