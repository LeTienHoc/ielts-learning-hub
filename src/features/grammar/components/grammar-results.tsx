import { notFound } from "next/navigation"

import { PracticeResults } from "@/features/practice"
import { getGrammarTopic } from "@/server/grammar/grammar-service"

import {
  grammarAttemptHref,
  grammarAttemptParamsSchema,
  grammarPracticeHref,
  grammarTopicHref,
} from "../routes"

type GrammarResultsProps = { params: Promise<{ topicSlug: string; attemptId: string }> }

/** Results of a grammar practice attempt. */
export async function GrammarResults({ params }: GrammarResultsProps) {
  const parsed = grammarAttemptParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { topicSlug, attemptId } = parsed.data

  const topic = await getGrammarTopic(topicSlug)
  if (!topic?.practiceSetSlug) notFound()

  return (
    <PracticeResults
      module="grammar"
      setSlug={topic.practiceSetSlug}
      attemptId={attemptId}
      attemptHref={grammarAttemptHref(topicSlug, attemptId)}
      attemptsHrefPrefix={grammarPracticeHref(topicSlug)}
      back={{ href: grammarTopicHref(topicSlug), label: topic.title }}
    />
  )
}
