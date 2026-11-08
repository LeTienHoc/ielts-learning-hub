import { notFound } from "next/navigation"

import { PracticeAttempt } from "@/features/practice"
import { getGrammarTopic } from "@/server/grammar/grammar-service"

import { grammarAttemptParamsSchema, grammarResultsHref, grammarTopicHref } from "../routes"

type GrammarPracticeProps = { params: Promise<{ topicSlug: string; attemptId: string }> }

/** Grammar practice in focus mode with instant checks (GRAM-03). */
export async function GrammarPractice({ params }: GrammarPracticeProps) {
  const parsed = grammarAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { topicSlug, attemptId } = parsed.data

  const topic = await getGrammarTopic(topicSlug)
  if (!topic?.practiceSetSlug) notFound()

  return (
    <PracticeAttempt
      module="grammar"
      setSlug={topic.practiceSetSlug}
      attemptId={attemptId}
      exitHref={grammarTopicHref(topicSlug)}
      reviewHref={grammarResultsHref(topicSlug, attemptId)}
      withInstantCheck
    />
  )
}
