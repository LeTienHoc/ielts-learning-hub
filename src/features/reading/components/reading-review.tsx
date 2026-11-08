import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { AttemptReview, StartAttemptButton } from "@/features/practice"
import { getCurrentUser } from "@/server/auth/session"
import {
  getAttempt,
  getAttemptReview,
  getPracticeSetBySlug,
} from "@/server/practice/practice-service"

import { readingAttemptHref, readingAttemptParamsSchema, readingAttemptsHref } from "../routes"

type ReadingReviewProps = { params: Promise<{ setSlug: string; attemptId: string }> }

/** Results and explanations of a submitted attempt (READ-04). */
export async function ReadingReview({ params }: ReadingReviewProps) {
  const parsed = readingAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { setSlug, attemptId } = parsed.data

  const [set, attempt, user] = await Promise.all([
    getPracticeSetBySlug("reading", setSlug),
    getAttempt(attemptId),
    getCurrentUser(),
  ])
  if (!set || !attempt || attempt.practiceSetId !== set.id) notFound()
  if (attempt.status !== "submitted") redirect(readingAttemptHref(set.slug, attempt.id))

  const keys = await getAttemptReview(attempt.id)
  if (!keys.ok) notFound()

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/reading">
            <ArrowLeft aria-hidden="true" />
            Reading
          </Link>
        </Button>
        <PageHeader title="Results" description={set.title} />
      </div>
      <AttemptReview
        set={set}
        attempt={attempt}
        keys={keys.value}
        explanationLanguage={user?.explanationLanguage ?? "en"}
        actions={
          <StartAttemptButton
            practiceSetId={set.id}
            mode={attempt.mode}
            attemptHrefPrefix={readingAttemptsHref(set.slug)}
            variant="outline"
          >
            Try again
          </StartAttemptButton>
        }
      />
    </div>
  )
}
