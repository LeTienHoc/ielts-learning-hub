import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { StartAttemptButton } from "@/features/practice"
import { getCurrentUser } from "@/server/auth/session"
import { getGrammarTopic } from "@/server/grammar/grammar-service"
import { getActiveAttempt } from "@/server/practice/practice-service"

import { grammarAttemptHref, grammarPracticeHref, grammarTopicParamsSchema } from "../routes"
import { GrammarLessonView } from "./grammar-lesson-view"

type GrammarTopicProps = { params: Promise<{ topicSlug: string }> }

/** A grammar lesson followed by its practice (GRAM-02, GRAM-03). */
export async function GrammarTopic({ params }: GrammarTopicProps) {
  const parsed = grammarTopicParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()

  const [topic, user] = await Promise.all([
    getGrammarTopic(parsed.data.topicSlug),
    getCurrentUser(),
  ])
  if (!topic) notFound()
  const active = topic.practiceSetId ? await getActiveAttempt(topic.practiceSetId) : null

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/grammar">
            <ArrowLeft aria-hidden="true" />
            Grammar
          </Link>
        </Button>
        <PageHeader title={topic.title} description={topic.summary ?? undefined} />
        <Badge variant="secondary" className="self-start">
          {topic.level}
        </Badge>
      </div>

      <GrammarLessonView
        lesson={topic.lesson}
        explanationLanguage={user?.explanationLanguage ?? "en"}
      />

      {topic.practiceSetId && (
        <Card className="max-w-3xl">
          <CardHeader>
            <Sparkles aria-hidden="true" className="size-6 text-primary" />
            <CardTitle className="text-h4">
              <h2>{active ? "Continue your practice" : "Practise it now"}</h2>
            </CardTitle>
            <CardDescription>
              A few quick questions. Check each answer to see straight away why it is right or
              wrong.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            {active ? (
              <Button asChild>
                <Link href={grammarAttemptHref(topic.slug, active.id)}>Continue</Link>
              </Button>
            ) : (
              <StartAttemptButton
                practiceSetId={topic.practiceSetId}
                mode="learn"
                attemptHrefPrefix={grammarPracticeHref(topic.slug)}
              >
                Start practice
              </StartAttemptButton>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
