import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { VOCABULARY_HREF, VOCABULARY_REVIEW_HREF } from "../routes"
import type { SessionSummary } from "../utils/review-session"
import { plural } from "../utils/plural"

/** End of the daily session: a calm summary and, only if some are left, optional extra reviews. */
export function SessionDone({ summary }: { summary: SessionSummary }) {
  return (
    <Card className="mx-auto w-full max-w-xl text-center">
      <CardHeader>
        <CardTitle className="text-h3">
          <h2>All done for today</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-muted-foreground">Reviewed</dt>
            <dd className="text-h4 text-foreground">{summary.reviewed}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-muted-foreground">New words</dt>
            <dd className="text-h4 text-foreground">{summary.newWords}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-caption text-muted-foreground">Best combo</dt>
            <dd className="text-h4 text-foreground">{summary.bestCombo}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-center gap-2">
        {summary.extraDueCount > 0 && (
          <Button asChild variant="outline">
            <Link href={VOCABULARY_REVIEW_HREF} aria-label={`Review ${summary.extraDueCount} more`}>
              Review {plural(summary.extraDueCount, "more word", "more words")}
            </Link>
          </Button>
        )}
        <Button asChild>
          <Link href={VOCABULARY_HREF}>Back to Vocabulary</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
