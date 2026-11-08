import { SpellCheck } from "lucide-react"

import { EmptyState } from "@/components/feedback/empty-state"
import { listGrammarTopics } from "@/server/grammar/grammar-service"

import { GrammarTopicList } from "./grammar-topic-list"

/** Grammar topic catalogue (GRAM-01). Reads the session: render inside <Suspense>. */
export async function GrammarCatalogue() {
  const topics = await listGrammarTopics()
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={SpellCheck}
        title="No grammar lessons yet"
        description="Grammar lessons and practice will appear here once they are published."
      />
    )
  }
  return <GrammarTopicList topics={topics} />
}
