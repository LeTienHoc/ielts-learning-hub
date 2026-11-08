import { ArrowLeft, Clock, GraduationCap } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QUESTION_TYPE_LABELS } from "@/lib/content/practice-set-schema"
import { StartAttemptButton } from "@/features/practice"
import { getActiveAttempt, getPracticeSetBySlug } from "@/server/practice/practice-service"
import { listReadingHistory } from "@/server/practice/reading-history"

import { readingAttemptHref, readingAttemptsHref, readingSetParamsSchema } from "../routes"
import { ReadingHistoryList } from "./reading-history-list"

type ReadingSetIntroProps = { params: Promise<{ setSlug: string }> }

/** Set intro: what the set covers and a choice of learn or test mode (READ-02). */
export async function ReadingSetIntro({ params }: ReadingSetIntroProps) {
  const parsed = readingSetParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()

  const set = await getPracticeSetBySlug("reading", parsed.data.setSlug)
  if (!set) notFound()
  const [active, recent] = await Promise.all([
    getActiveAttempt(set.id),
    listReadingHistory({ practiceSetId: set.id, limit: 3 }),
  ])

  const questionTypes = [...new Set(set.groups.map((group) => QUESTION_TYPE_LABELS[group.type]))]
  const minutes =
    set.testTimeLimitSeconds === null ? null : Math.round(set.testTimeLimitSeconds / 60)
  const attemptsHref = readingAttemptsHref(set.slug)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/reading">
            <ArrowLeft aria-hidden="true" />
            Reading
          </Link>
        </Button>
        <PageHeader title={set.title} description={set.summary ?? undefined} />
        <div className="flex flex-wrap gap-1.5">
          {set.kind === "full_test" && <Badge>Full test</Badge>}
          <Badge variant="secondary">{set.level}</Badge>
          {set.topics.map((topic) => (
            <Badge key={topic} variant="outline" className="capitalize">
              {topic}
            </Badge>
          ))}
        </div>
        <p className="text-body-sm text-muted-foreground">
          {set.passages.length > 1 && `${set.passages.length} passages · `}
          {set.questionCount} questions · {questionTypes.join(" · ")}
        </p>
      </div>

      {active ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-h4">
              <h2>You have an unfinished attempt</h2>
            </CardTitle>
            <CardDescription>
              {active.mode === "test"
                ? "Test mode — the timer kept running while you were away."
                : "Learn mode — your answers were saved."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href={readingAttemptHref(set.slug, active.id)}>Continue</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <GraduationCap aria-hidden="true" className="size-6 text-primary" />
              <CardTitle className="text-h4">
                <h2>Learn mode</h2>
              </CardTitle>
              <CardDescription>No timer. Work at your own pace.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-body-sm text-muted-foreground">
              Your answers save as you go. After you submit, you see the correct answers,
              explanations and where the answer is in the passage.
            </CardContent>
            <CardFooter>
              <StartAttemptButton
                practiceSetId={set.id}
                mode="learn"
                attemptHrefPrefix={attemptsHref}
              >
                Start learn mode
              </StartAttemptButton>
            </CardFooter>
          </Card>
          {minutes !== null && (
            <Card>
              <CardHeader>
                <Clock aria-hidden="true" className="size-6 text-primary" />
                <CardTitle className="text-h4">
                  <h2>Test mode</h2>
                </CardTitle>
                <CardDescription>{minutes} minutes, like the real exam.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-body-sm text-muted-foreground">
                The timer keeps running if you leave the page. When time is up, your saved answers
                are submitted automatically.
              </CardContent>
              <CardFooter>
                <StartAttemptButton
                  practiceSetId={set.id}
                  mode="test"
                  attemptHrefPrefix={attemptsHref}
                  variant="outline"
                >
                  Start test
                </StartAttemptButton>
              </CardFooter>
            </Card>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-attempts" className="flex max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 id="recent-attempts" className="text-h4 text-foreground">
              Recent attempts
            </h2>
            <Link
              href="/reading/history"
              className="text-body-sm text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              All history
            </Link>
          </div>
          <ReadingHistoryList items={recent} hideTitle />
        </section>
      )}
    </div>
  )
}
