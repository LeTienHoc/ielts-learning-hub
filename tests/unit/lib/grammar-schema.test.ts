import { describe, expect, it } from "vitest"

import { grammarTopicSourceSchema } from "@/lib/content/grammar-schema"
import { tokenizeSentence } from "@/lib/content/practice-set-schema"

import { sampleTopic } from "../fixtures/content"

const messages = (input: unknown) => {
  const result = grammarTopicSourceSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("grammarTopicSourceSchema", () => {
  it("accepts a valid topic and derives its grammar practice set", () => {
    const topic = grammarTopicSourceSchema.parse(sampleTopic)
    expect(topic.practice.slug).toBe("articles-practice")
    expect(topic.practice.module).toBe("grammar")
    expect(topic.practice.testTimeLimitMinutes).toBeUndefined()
  })

  it("rejects a practice time limit (grammar practice is learn mode only)", () => {
    const withTimer = {
      ...sampleTopic,
      practice: { ...sampleTopic.practice, testTimeLimitMinutes: 10 },
    }
    expect(messages(withTimer).length).toBeGreaterThan(0)
  })

  it("requires the wrong word of a Spot-the-mistake item to be one word in the sentence", () => {
    const [first, second] = sampleTopic.practice.groups
    const broken = {
      ...sampleTopic,
      practice: {
        groups: [{ ...first, questions: [{ ...first?.questions[0], accepted: ["an"] }] }, second],
      },
    }
    expect(messages(broken)).toContain(
      "Group 1, question 1: the mistake must be exactly one word that appears once",
    )
  })

  it("requires a correction for Spot-the-mistake items", () => {
    const [first, second] = sampleTopic.practice.groups
    const withoutCorrection = {
      number: 1,
      prompt: "She is a honest student.",
      accepted: ["a"],
      explanation: "Honest starts with a vowel sound.",
    }
    const broken = {
      ...sampleTopic,
      practice: { groups: [{ ...first, questions: [withoutCorrection] }, second] },
    }
    expect(messages(broken)).toContain(
      "Group 1, question 1: Spot-the-mistake items need a correction",
    )
  })
})

describe("tokenizeSentence", () => {
  it("splits on spaces and matches words without trailing punctuation", () => {
    expect(tokenizeSentence("She is a honest student.")).toEqual([
      { id: "t1", text: "She", word: "she" },
      { id: "t2", text: "is", word: "is" },
      { id: "t3", text: "a", word: "a" },
      { id: "t4", text: "honest", word: "honest" },
      { id: "t5", text: "student.", word: "student" },
    ])
  })
})
