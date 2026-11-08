import type { Metadata } from "next"

import { ReviewSessionPage } from "@/features/vocabulary"

export const metadata: Metadata = { title: "Today's vocabulary session" }

// The group's loading.tsx is the Suspense boundary while the session starts.
export default function VocabularyReviewPage() {
  return <ReviewSessionPage />
}
