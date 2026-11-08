import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/server/auth/session"
import { getWord } from "@/server/vocabulary/vocabulary-service"

import { VOCABULARY_HREF, wordParamsSchema } from "../routes"
import { AddToMyWordsButton } from "./add-to-my-words-button"
import { WordCard } from "./word-card"

type WordDetailProps = { params: Promise<{ wordSlug: string }> }

/** Word detail (VOC-02) with the learner's real review status. */
export async function WordDetail({ params }: WordDetailProps) {
  const parsed = wordParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()

  const [word, user] = await Promise.all([getWord(parsed.data.wordSlug), getCurrentUser()])
  if (!word) notFound()

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={VOCABULARY_HREF}>
          <ArrowLeft aria-hidden="true" />
          Vocabulary
        </Link>
      </Button>
      <WordCard word={word} language={user?.explanationLanguage ?? "en"} />
      <div className="flex flex-wrap items-center gap-3">
        <AddToMyWordsButton kind="word" id={word.id} isAdded={word.inMyWords} />
        {word.srs?.isMastered && <Badge variant="success">Mastered</Badge>}
        {word.srs?.status === "new" && <Badge variant="secondary">Waiting to be introduced</Badge>}
      </div>
    </div>
  )
}
