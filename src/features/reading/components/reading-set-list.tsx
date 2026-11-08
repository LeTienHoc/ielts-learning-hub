import { Clock, FileText, ListChecks, SearchX } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PracticeSetSummary } from "@/features/practice"
import { QUESTION_TYPE_LABELS } from "@/lib/content/practice-set-schema"

import { readingSetHref } from "../routes"

type ReadingSetListProps = { sets: readonly PracticeSetSummary[] }

/** Reading sets as cards: level, full test badge, question types, passages and test time. */
export function ReadingSetList({ sets }: ReadingSetListProps) {
  if (sets.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No sets match these filters"
        description="Try another question type or level."
        action={
          <Button asChild variant="outline">
            <Link href="/reading">Clear filters</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul aria-label="Reading practice sets" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sets.map((set) => (
        <li key={set.id}>
          <Card className="relative h-full transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap gap-1.5">
                {set.kind === "full_test" && <Badge>Full test</Badge>}
                <Badge variant="secondary">{set.level}</Badge>
                {set.topics.map((topic) => (
                  <Badge key={topic} variant="outline" className="capitalize">
                    {topic}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-h4">
                <h2>
                  {/* The link covers the card so the whole card is clickable. */}
                  <Link
                    href={readingSetHref(set.slug)}
                    className="outline-none after:absolute after:inset-0"
                  >
                    {set.title}
                  </Link>
                </h2>
              </CardTitle>
              {set.summary && <CardDescription>{set.summary}</CardDescription>}
              <p className="text-body-sm text-muted-foreground">
                {set.questionTypes.map((type) => QUESTION_TYPE_LABELS[type]).join(" · ")}
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
                {set.passageCount > 1 && (
                  <span className="inline-flex items-center gap-1">
                    <FileText aria-hidden="true" className="size-4" />
                    {set.passageCount} passages
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <ListChecks aria-hidden="true" className="size-4" />
                  {set.questionCount} questions
                </span>
                {set.testTimeLimitSeconds !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" className="size-4" />
                    Test: {Math.round(set.testTimeLimitSeconds / 60)} min
                  </span>
                )}
              </p>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  )
}
