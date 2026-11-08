import { describe, expect, it } from "vitest"

import {
  vocabularySetSourceSchema,
  type VocabularySetSource,
  type WordSource,
} from "@/lib/content/vocabulary-schema"

import { sampleWord } from "../fixtures/content"

function sampleSet(words: WordSource[]): VocabularySetSource {
  return {
    slug: "environment",
    title: "Environment",
    level: "B2",
    topics: ["environment"],
    source: "ai_assisted",
    reviewStatus: "published",
    version: 1,
    words,
  }
}

const messages = (input: unknown) => {
  const result = vocabularySetSourceSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("vocabularySetSourceSchema", () => {
  it("accepts a valid set", () => {
    expect(messages(sampleSet([sampleWord("sustainable")]))).toEqual([])
  })

  it("rejects a cloze word that is not in its sentence", () => {
    const word = sampleWord("sustainable", {
      examples: [{ en: "Cities need green transport.", vi: "…", cloze: "sustainable" }],
    })
    expect(messages(sampleSet([word]))).toContain(
      'Example 1 of "sustainable": cloze must appear once in the sentence',
    )
  })

  it("rejects duplicate word slugs within a set", () => {
    expect(messages(sampleSet([sampleWord("sustainable"), sampleWord("sustainable")]))).toContain(
      'Word "sustainable" appears twice in the set',
    )
  })

  it("rejects unknown topics and empty meanings", () => {
    expect(
      messages(sampleSet([sampleWord("sustainable", { meaningVi: "" })])).length,
    ).toBeGreaterThan(0)
    expect(
      messages({ ...sampleSet([sampleWord("sustainable")]), topics: ["sport"] }).length,
    ).toBeGreaterThan(0)
  })
})
