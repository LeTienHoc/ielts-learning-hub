import type { Metadata } from "next"

import { ReadingAttempt } from "@/features/reading"

export const metadata: Metadata = { title: "Reading practice" }

// The group's loading.tsx is the Suspense boundary while the attempt loads.
export default function ReadingAttemptPage({
  params,
}: PageProps<"/reading/[setSlug]/attempt/[attemptId]">) {
  return <ReadingAttempt params={params} />
}
