import type { Metadata } from "next"

import { GrammarPractice } from "@/features/grammar"

export const metadata: Metadata = { title: "Grammar practice" }

// The group's loading.tsx is the Suspense boundary while the attempt loads.
export default function GrammarPracticePage({
  params,
}: PageProps<"/grammar/[topicSlug]/practice/[attemptId]">) {
  return <GrammarPractice params={params} />
}
