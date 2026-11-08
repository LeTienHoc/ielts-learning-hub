import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { practiceSetSourceSchema, type PracticeSetSource } from "@/lib/content/practice-set-schema"

import { sampleWord } from "../fixtures/content"

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
    passages: [{ title: "Passage", text: "Plants cool roofs. Rain drains slowly.", keyWords: [] }],
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
    expect(issues({ ...validSet(), passages: [] })).toContain("Evidence quotes need a passage")
  })

  it("rejects unknown topics and invalid slugs", () => {
    expect(issues({ ...validSet(), topics: ["sport"] }).length).toBeGreaterThan(0)
    expect(issues({ ...validSet(), slug: "Not A Slug" }).length).toBeGreaterThan(0)
  })
})

describe("practiceSetSourceSchema for passages and full tests", () => {
  const question = (number: number) => ({
    number,
    prompt: `Statement ${number}.`,
    accepted: ["TRUE"],
    explanation: "Stated.",
  })
  const fullTest = (overrides: Record<string, unknown> = {}) => ({
    ...validSet(),
    kind: "full_test",
    testTimeLimitMinutes: 60,
    passages: [1, 2, 3].map((n) => ({ title: `Passage ${n}`, text: `Text of passage ${n}.` })),
    groups: [1, 2, 3].map((n) => ({
      type: "true_false_not_given",
      instructions: "Choose.",
      passage: n,
      // 13 + 13 + 14 = 40 marks
      questions: Array.from({ length: n === 3 ? 14 : 13 }, (_, i) =>
        question((n - 1) * 13 + i + 1),
      ),
    })),
    ...overrides,
  })

  it("accepts a full test with 3 passages, 40 marks and 60 minutes", () => {
    expect(issues(fullTest())).toEqual([])
  })

  it("enforces the full test shape", () => {
    expect(issues(fullTest({ passages: fullTest().passages.slice(0, 2) }))).toContain(
      "A full test needs 3 passages",
    )
    expect(issues(fullTest({ groups: fullTest().groups.slice(0, 2) }))).toContain(
      "A full test has 40 marks (found 26)",
    )
    expect(issues(fullTest({ testTimeLimitMinutes: 20 }))).toContain(
      "A full test takes 60 minutes in test mode",
    )
  })

  it("rejects a group that points to a missing passage", () => {
    const set = validSet()
    const [first, ...rest] = set.groups
    if (!first) throw new Error("fixture has groups")
    expect(issues({ ...set, groups: [{ ...first, passage: 2 }, ...rest] })).toContain(
      "Group 1 refers to passage 2, which does not exist",
    )
  })

  it("requires key words to appear in their passage", () => {
    const keyWord = (form: string) => ({ form, word: sampleWord("vegetation") })
    expect(
      issues({
        ...validSet(),
        passages: [{ title: "P", text: "Plants cool roofs.", keyWords: [keyWord("Plants")] }],
      }),
    ).toEqual([])
    expect(
      issues({
        ...validSet(),
        passages: [{ title: "P", text: "Plants cool roofs.", keyWords: [keyWord("Trees")] }],
      }),
    ).toContain('Key word "Trees" is not in passage 1')
  })
})
