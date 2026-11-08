import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { AddToMyWordsButton } from "@/features/vocabulary"
import type { PracticeModule } from "@/lib/content/practice-set-schema"
import { getCurrentUser } from "@/server/auth/session"
import {
  getAttempt,
  getAttemptReview,
  getPracticeSetBySlug,
} from "@/server/practice/practice-service"

import { AttemptReview } from "./attempt-review"
import { StartAttemptButton } from "./start-attempt-button"

type PracticeResultsProps = {
  module: PracticeModule
  setSlug: string
  attemptId: string
  /** Where an unfinished attempt continues. */
  attemptHref: string
  /** Prefix for a new attempt's URL ("Try again"). */
  attemptsHrefPrefix: string
  back: { href: string; label: string }
  title?: string
}

/**
 * Results and explanations of a submitted attempt (READ-04, GRAM-03).
 * Reads the session: render inside <Suspense>.
 */
export async function PracticeResults({
  module,
  setSlug,
  attemptId,
  attemptHref,
  attemptsHrefPrefix,
  back,
  title = "Results",
}: PracticeResultsProps) {
  const [set, attempt, user] = await Promise.all([
    getPracticeSetBySlug(module, setSlug),
    getAttempt(attemptId),
    getCurrentUser(),
  ])
  if (!set || !attempt || attempt.practiceSetId !== set.id) notFound()
  if (attempt.status !== "submitted") redirect(attemptHref)

  const keys = await getAttemptReview(attempt.id)
  if (!keys.ok) notFound()

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
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={back.href}>
            <ArrowLeft aria-hidden="true" />
            {back.label}
          </Link>
        </Button>
        <PageHeader title={title} description={set.title} />
      </div>
      <AttemptReview
        set={set}
        attempt={attempt}
        keys={keys.value}
        explanationLanguage={user?.explanationLanguage ?? "en"}
        keyWordActions={keyWordActions}
        actions={
          <StartAttemptButton
            practiceSetId={set.id}
            mode={attempt.mode}
            attemptHrefPrefix={attemptsHrefPrefix}
            variant="outline"
          >
            Try again
          </StartAttemptButton>
        }
      />
    </div>
  )
}
