import { BookA } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/feedback/empty-state"
import { FocusShell } from "@/components/layout/focus-shell"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/server/auth/session"
import { getVocabularyOverview, startReviewSession } from "@/server/vocabulary/vocabulary-service"

import { VOCABULARY_HREF, VOCABULARY_SETS_HREF } from "../routes"
import { ReviewSession } from "./review-session"

/** Starts today's session on the server (introduces new words, loads due reviews). */
export async function ReviewSessionPage() {
  const overview = await getVocabularyOverview()
  if (overview.myWordsCount === 0) {
    return (
      <FocusShell title="Today's session" exitHref={VOCABULARY_HREF}>
        <EmptyState
          icon={BookA}
          title="Add a set to start learning"
          description="Your daily session uses the words in My words."
          action={
            <Button asChild>
              <Link href={VOCABULARY_SETS_HREF}>Browse vocabulary sets</Link>
            </Button>
          }
        />
      </FocusShell>
    )
  }

  const [plan, user] = await Promise.all([startReviewSession(), getCurrentUser()])
  return <ReviewSession plan={plan} language={user?.explanationLanguage ?? "en"} />
}
