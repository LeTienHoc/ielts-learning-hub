import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { practiceSetSourceSchema, type PracticeSetSource } from "@/lib/content/practice-set-schema"

function validSet(): PracticeSetSource {
  return {
    slug: "sample-set",
    title: "Sample",
    level: "B1",
    topics: ["environment"],
    source: "original",
    reviewStatus: "draft",
    version: 1,
    module: "reading",
    passage: { title: "Passage", text: "Plants cool roofs. Rain drains slowly." },
    groups: [
      {
        type: "true_false_not_given",
        instructions: "Choose TRUE, FALSE or NOT GIVEN.",
        questions: [
          {
            number: 1,
            prompt: "Plants cool roofs.",
            accepted: ["TRUE"],
            explanation: "Stated.",
            evidence: "Plants cool roofs.",
          },
        ],
      },
      {
        type: "sentence_completion",
        instructions: "Write ONE WORD.",
        questions: [
          {
            number: 2,
            prompt: "Rain drains ____.",
            accepted: ["slowly"],
            maxWords: 1,
            explanation: "Stated.",
          },
        ],
      },
    ],
  }
}

const issues = (input: unknown) => {
  const result = practiceSetSourceSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("practiceSetSourceSchema", () => {
  it("accepts a valid set and uses the default True/False/Not Given options", () => {
    expect(issues(validSet())).toEqual([])
  })

  it("accepts the repository's content files", () => {
    const file = path.resolve("content/practice-sets/reading-rooftop-gardens.json")
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"))
    expect(issues(raw)).toEqual([])
  })

  it("rejects question numbers that are not increasing", () => {
    const set = validSet()
    const second = set.groups[1]?.questions[0]
    if (second) second.number = 1
    expect(issues(set)).toContain("Question 1 is out of order")
  })

  it("rejects accepted ids that are not options", () => {
    const set = validSet()
    const first = set.groups[0]?.questions[0]
    if (first) first.accepted = ["MAYBE"]
    expect(issues(set)).toContain("Group 1, question 1: accepted ids must be options")
  })

  it("requires exactly one answer for single-choice questions", () => {
    const set = validSet()
    const first = set.groups[0]?.questions[0]
    if (first) first.accepted = ["TRUE", "FALSE"]
    expect(issues(set)).toContain("Group 1, question 1: needs exactly one accepted id")
  })

  it("rejects text answers longer than the word limit", () => {
    const set = validSet()
    const second = set.groups[1]?.questions[0]
    if (second) second.accepted = ["very slowly"]
    expect(issues(set)).toContain("Group 2, question 2: an answer exceeds maxWords")
  })

  it("requires options for matching and multiple-choice groups", () => {
    const set = validSet()
    const [first, ...rest] = set.groups
    if (!first) throw new Error("fixture has groups")
    set.groups = [{ ...first, type: "multiple_choice" }, ...rest]
    expect(issues(set)).toContain("Group 1, question 1: choice questions need options")
  })

  it("requires 2 to 5 answers for multi-answer questions", () => {
    const set = validSet()
    set.groups[0] = {
      type: "multiple_choice_multi",
      instructions: "Choose TWO.",
      questions: [
        {
          number: 1,
          prompt: "Which TWO?",
          options: [
            { id: "A", text: "a" },
            { id: "B", text: "b" },
          ],
          accepted: ["A"],
          explanation: "Stated.",
        },
      ],
    }
    expect(issues(set)).toContain("Group 1, question 1: needs 2 to 5 accepted ids")
  })

  it("rejects evidence without a passage", () => {
    const { passage: _passage, ...withoutPassage } = validSet()
    expect(issues(withoutPassage)).toContain("Evidence quotes need a passage")
  })

  it("rejects unknown topics and invalid slugs", () => {
    expect(issues({ ...validSet(), topics: ["sport"] }).length).toBeGreaterThan(0)
    expect(issues({ ...validSet(), slug: "Not A Slug" }).length).toBeGreaterThan(0)
  })
})
