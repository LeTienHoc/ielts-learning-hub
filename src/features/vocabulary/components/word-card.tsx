import { Badge } from "@/components/ui/badge"

import type { ReviewCard } from "../types"
import { ListenButton } from "./listen-button"

type WordCardProps = {
  word: Pick<
    ReviewCard,
    | "lemma"
    | "ipa"
    | "partOfSpeech"
    | "meaningEn"
    | "meaningVi"
    | "examples"
    | "collocations"
    | "commonMistakes"
  >
  language: "en" | "vi"
}

/** A word explained the friendly way: meaning in both languages, real examples, collocations. */
export function WordCard({ word, language }: WordCardProps) {
  const [firstMeaning, secondMeaning] =
    language === "vi" ? [word.meaningVi, word.meaningEn] : [word.meaningEn, word.meaningVi]
  return (
    <article aria-label={`Word: ${word.lemma}`} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-h2 text-foreground" lang="en">
          {word.lemma}
        </h2>
        <Badge variant="secondary">{word.partOfSpeech}</Badge>
        {word.ipa && (
          <span className="font-mono text-body-sm text-muted-foreground">{word.ipa}</span>
        )}
        <ListenButton text={word.lemma} />
      </header>

      <div className="flex flex-col gap-1">
        <p className="text-body-lg text-foreground">{firstMeaning}</p>
        <p className="text-body-sm text-muted-foreground">{secondMeaning}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-label text-muted-foreground">Examples</h3>
        <ul className="flex flex-col gap-2">
          {word.examples.map((example) => (
            <li
              key={example.en}
              className="rounded-md border-l-2 border-primary bg-primary-subtle/40 px-3 py-2"
            >
              <p className="text-body text-foreground" lang="en">
                {example.en}
              </p>
              <p className="text-body-sm text-muted-foreground" lang="vi">
                {example.vi}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {word.collocations.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-label text-muted-foreground">Goes well with</h3>
          <ul className="flex flex-wrap gap-1.5">
            {word.collocations.map((phrase) => (
              <li key={phrase}>
                <Badge variant="outline" lang="en">
                  {phrase}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {word.commonMistakes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-label text-muted-foreground">Watch out</h3>
          <ul className="flex flex-col gap-2">
            {word.commonMistakes.map((mistake) => (
              <li key={mistake.wrong} className="flex flex-col gap-0.5 text-body-sm">
                <span className="text-error-emphasis">
                  <span className="sr-only">Wrong: </span>
                  <span className="line-through">{mistake.wrong}</span>
                </span>
                <span className="font-medium text-success-emphasis">
                  <span className="sr-only">Right: </span>
                  {mistake.right}
                </span>
                <span className="text-muted-foreground">
                  {language === "vi" ? mistake.whyVi : mistake.whyEn}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
