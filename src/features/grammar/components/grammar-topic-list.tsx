import { CircleCheck, CircleDashed, CircleDot } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GrammarTopicSummary } from "@/server/grammar/grammar-service"

import { grammarTopicHref } from "../routes"

const MASTERY = {
  not_started: { icon: CircleDashed, variant: "secondary" },
  practising: { icon: CircleDot, variant: "warning" },
  mastered: { icon: CircleCheck, variant: "success" },
} as const

function masteryLabel(topic: GrammarTopicSummary): string {
  if (topic.mastery === "not_started") return "Not started"
  const name = topic.mastery === "mastered" ? "Mastered" : "Practising"
  return topic.lastScorePercent === null ? name : `${name} · ${topic.lastScorePercent}%`
}

/** Grammar topics grouped by level, each with the learner's real mastery (GRAM-01, GRAM-04). */
export function GrammarTopicList({ topics }: { topics: readonly GrammarTopicSummary[] }) {
  const levels = [...new Set(topics.map((topic) => topic.level))].sort()

  return (
    <div className="flex flex-col gap-8">
      {levels.map((level) => (
        <section key={level} aria-label={`Level ${level}`} className="flex flex-col gap-3">
          <h2 className="text-h4 text-foreground">Level {level}</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {topics
              .filter((topic) => topic.level === level)
              .map((topic) => {
                const mastery = MASTERY[topic.mastery]
                return (
                  <li key={topic.slug}>
                    <Card className="relative h-full transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40">
                      <CardHeader className="gap-2">
                        <Badge variant={mastery.variant} className="self-start">
                          <mastery.icon aria-hidden="true" />
                          {masteryLabel(topic)}
                        </Badge>
                        <CardTitle className="text-h4">
                          <h3>
                            {/* The link covers the card so the whole card is clickable. */}
                            <Link
                              href={grammarTopicHref(topic.slug)}
                              className="outline-none after:absolute after:inset-0"
                            >
                              {topic.title}
                            </Link>
                          </h3>
                        </CardTitle>
                        {topic.summary && <CardDescription>{topic.summary}</CardDescription>}
                      </CardHeader>
                    </Card>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
