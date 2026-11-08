"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

import { stableShuffle } from "../utils/cloze"

export type MatchWord = { id: string; lemma: string; meaning: string }

type MatchPairsProps = {
  words: readonly MatchWord[]
  /** Fires once per word, for its first try only (that is what gets graded). */
  onResult: (wordId: string, isCorrect: boolean) => void
  onComplete: () => void
}

/** "Match pairs" (Ghép đôi): tap a word, then its meaning. Matched pairs disappear. */
export function MatchPairs({ words, onResult, onComplete }: MatchPairsProps) {
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [reported, setReported] = useState<ReadonlySet<string>>(new Set())
  const [missed, setMissed] = useState<string | null>(null)

  const meanings = stableShuffle(words, (word) => word.meaning, "match")
  const remaining = words.filter((word) => !matched.has(word.id))

  const report = (wordId: string, isCorrect: boolean) => {
    if (reported.has(wordId)) return
    setReported((current) => new Set(current).add(wordId))
    onResult(wordId, isCorrect)
  }

  const chooseMeaning = (meaningOwnerId: string) => {
    if (!selected) return
    if (meaningOwnerId === selected) {
      report(selected, true)
      const next = new Set(matched).add(selected)
      setMatched(next)
      setSelected(null)
      setMissed(null)
      if (next.size === words.length) onComplete()
      return
    }
    report(selected, false)
    setMissed(meaningOwnerId)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <ul aria-label="Words" className="flex flex-col gap-2">
        {remaining.map((word) => (
          <li key={word.id}>
            <button
              type="button"
              aria-pressed={selected === word.id}
              onClick={() => {
                setSelected(word.id)
                setMissed(null)
              }}
              className={cn(
                "w-full rounded-md border border-border bg-background px-3 py-2.5 text-left text-body font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                selected === word.id &&
                  "border-primary bg-primary-subtle text-primary-subtle-foreground",
              )}
            >
              {word.lemma}
            </button>
          </li>
        ))}
      </ul>
      <ul aria-label="Meanings" className="flex flex-col gap-2">
        {meanings
          .filter((word) => !matched.has(word.id))
          .map((word) => (
            <li key={word.id}>
              <button
                type="button"
                onClick={() => chooseMeaning(word.id)}
                className={cn(
                  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-left text-body-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  missed === word.id &&
                    "border-warning bg-warning-subtle motion-safe:animate-shake",
                )}
              >
                {word.meaning}
              </button>
            </li>
          ))}
      </ul>
      <p role="status" className="col-span-2 min-h-5 text-body-sm text-muted-foreground">
        {missed
          ? "Not that one. Try another meaning."
          : selected
            ? "Now tap its meaning."
            : "Tap a word to start."}
      </p>
    </div>
  )
}
