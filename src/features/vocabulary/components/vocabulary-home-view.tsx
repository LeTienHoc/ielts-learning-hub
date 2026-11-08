import { BookA, Layers } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { VOCABULARY_REVIEW_HREF, VOCABULARY_SETS_HREF } from "../routes"
import { plural } from "../utils/plural"

export type VocabularyOverview = {
  dueCount: number
  newWaitingCount: number
  newAllowanceToday: number
  myWordsCount: number
  masteredCount: number
}

/** Vocabulary home: today's session from real counts, or a first step for new learners. */
export function VocabularyHomeView({ overview }: { overview: VocabularyOverview }) {
  if (overview.myWordsCount === 0) {
    return (
      <EmptyState
        icon={BookA}
        title="Add a set to start learning"
        description="Pick an IELTS topic. Each day you learn a few new words and review the ones that are due."
        action={
          <Button asChild>
            <Link href={VOCABULARY_SETS_HREF}>Browse vocabulary sets</Link>
          </Button>
        }
      />
    )
  }

  const hasWork = overview.dueCount + overview.newAllowanceToday > 0
  return (
    <div className="flex flex-col gap-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-h4">
            <h2>Today&apos;s session</h2>
          </CardTitle>
          <CardDescription>
            {hasWork
              ? `${plural(overview.dueCount, "review")} due · ${plural(overview.newAllowanceToday, "new word")} today`
              : "You're all caught up. New reviews will appear when they are due."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm text-muted-foreground">
          <span>{plural(overview.newWaitingCount, "new word")} waiting</span>
          <span>{plural(overview.myWordsCount, "word")} in My words</span>
          <span>{overview.masteredCount} mastered</span>
        </CardContent>
        <CardFooter>
          <Button asChild variant={hasWork ? "default" : "outline"}>
            <Link href={VOCABULARY_REVIEW_HREF}>Start today&apos;s session</Link>
          </Button>
        </CardFooter>
      </Card>
      <Button asChild variant="ghost" className="self-start">
        <Link href={VOCABULARY_SETS_HREF}>
          <Layers aria-hidden="true" />
          Browse vocabulary sets
        </Link>
      </Button>
    </div>
  )
}
