import { BookA } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listVocabularySets } from "@/server/vocabulary/vocabulary-service"

import { vocabularySetHref } from "../routes"

/** Vocabulary sets by IELTS topic (VOC-01). Reads the session: render inside <Suspense>. */
export async function SetCatalogue() {
  const sets = await listVocabularySets()
  if (sets.length === 0) {
    return (
      <EmptyState
        icon={BookA}
        title="No vocabulary sets yet"
        description="Topic sets will appear here once they are published."
      />
    )
  }
  return (
    <ul aria-label="Vocabulary sets" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sets.map((set) => (
        <li key={set.id}>
          <Card className="relative h-full transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{set.level}</Badge>
                {set.addedCount > 0 && (
                  <Badge variant="success">
                    {set.addedCount}/{set.wordCount} in My words
                  </Badge>
                )}
              </div>
              <CardTitle className="text-h4">
                <h2>
                  {/* The link covers the card so the whole card is clickable. */}
                  <Link
                    href={vocabularySetHref(set.slug)}
                    className="outline-none after:absolute after:inset-0"
                  >
                    {set.title}
                  </Link>
                </h2>
              </CardTitle>
              {set.summary && <CardDescription>{set.summary}</CardDescription>}
              <p className="text-caption text-muted-foreground">{set.wordCount} words</p>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  )
}
