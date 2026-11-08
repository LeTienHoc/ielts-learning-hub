import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/server/auth/session"
import { getVocabularySet } from "@/server/vocabulary/vocabulary-service"

import { VOCABULARY_SETS_HREF, vocabularySetParamsSchema, wordHref } from "../routes"
import { AddToMyWordsButton } from "./add-to-my-words-button"

type SetDetailProps = { params: Promise<{ setSlug: string }> }

/** One topic set: its words and "Start learning this set" (VOC-01, VOC-03). */
export async function SetDetail({ params }: SetDetailProps) {
  const parsed = vocabularySetParamsSchema.safeParse(await params)
  if (!parsed.success) notFound()

  const [set, user] = await Promise.all([getVocabularySet(parsed.data.setSlug), getCurrentUser()])
  if (!set) notFound()
  const language = user?.explanationLanguage ?? "en"

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={VOCABULARY_SETS_HREF}>
            <ArrowLeft aria-hidden="true" />
            Vocabulary sets
          </Link>
        </Button>
        <PageHeader title={set.title} description={set.summary ?? undefined} />
        <AddToMyWordsButton kind="set" id={set.id} isAdded={set.addedCount === set.wordCount} />
        <p className="text-body-sm text-muted-foreground">
          Words are introduced a few at a time in your daily session, so you never cram.
        </p>
      </div>
      <ul aria-label="Words in this set" className="grid gap-2 md:grid-cols-2">
        {set.words.map((word) => (
          <li key={word.id}>
            <Link
              href={wordHref(word.slug)}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-body font-semibold text-foreground" lang="en">
                  {word.lemma}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {language === "vi" ? word.meaningVi : word.meaningEn}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <Badge variant="outline">{word.partOfSpeech}</Badge>
                {word.inMyWords && (
                  <Check aria-label="In My words" className="size-4 text-success" />
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
