import { BookOpenText, Clock, ListChecks } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listPublishedPracticeSets } from "@/server/practice/practice-service"

import { readingSetHref } from "../routes"

/** Published Reading practice sets. Reads the session: render inside <Suspense>. */
export async function ReadingLibrary() {
  const sets = await listPublishedPracticeSets("reading")

  if (sets.length === 0) {
    return (
      <EmptyState
        icon={BookOpenText}
        title="No reading practice yet"
        description="Reading passages and question sets will appear here once they are published."
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
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
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
