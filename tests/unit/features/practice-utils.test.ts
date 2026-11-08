import { describe, expect, it } from "vitest"

import { saveAnswerSchema } from "@/features/practice/schemas/practice-schemas"
import {
  countAnswered,
  describeResponse,
  evidenceExcerpt,
  formatDuration,
  isAnswered,
  splitParagraphs,
} from "@/features/practice/utils/answers"

describe("isAnswered / countAnswered", () => {
  it("treats missing, empty and blank responses as unanswered", () => {
    expect(isAnswered(undefined)).toBe(false)
    expect(isAnswered([])).toBe(false)
    expect(isAnswered(["  "])).toBe(false)
    expect(isAnswered(["A"])).toBe(true)
  })

  it("counts answered questions only", () => {
    expect(countAnswered(["q1", "q2", "q3"], { q1: ["A"], q2: [], q4: ["x"] })).toBe(1)
  })
})

describe("formatDuration", () => {
  it("formats minutes and hours and clamps negatives", () => {
    expect(formatDuration(1200)).toBe("20:00")
    expect(formatDuration(65.9)).toBe("1:05")
    expect(formatDuration(3725)).toBe("1:02:05")
    expect(formatDuration(-3)).toBe("0:00")
  })
})

describe("describeResponse", () => {
  const options = [
    { id: "A", text: "regular weeding" },
    { id: "TRUE", text: "TRUE" },
    { id: "NOT_GIVEN", text: "NOT GIVEN" },
  ]

  it("shows only the text for options that spell out their id", () => {
    expect(describeResponse(["NOT_GIVEN"], options)).toBe("NOT GIVEN")
  })

  it("shows option ids with their text, or plain text answers", () => {
    expect(describeResponse(["A"], options)).toBe("A — regular weeding")
    expect(describeResponse(["TRUE"], options)).toBe("TRUE")
    expect(describeResponse(["solar energy"], [])).toBe("solar energy")
    expect(describeResponse(["A", "TRUE"], options)).toBe("A — regular weeding, TRUE")
  })

  it("returns null when there is no answer", () => {
    expect(describeResponse([], options)).toBeNull()
  })
})

describe("splitParagraphs", () => {
  it("splits on blank lines and drops empty paragraphs", () => {
    expect(splitParagraphs("A one.\n\nB two\nstill B.\n \n\nC")).toEqual([
      "A one.",
      "B two\nstill B.",
      "C",
    ])
  })
})

describe("evidenceExcerpt", () => {
  it("slices the passage for a valid range only", () => {
    expect(evidenceExcerpt("Roofs are hot.", { start: 0, end: 5 })).toBe("Roofs")
    expect(evidenceExcerpt("Roofs are hot.", null)).toBeNull()
    expect(evidenceExcerpt("Roofs", { start: 2, end: 99 })).toBeNull()
    expect(evidenceExcerpt("Roofs", { start: 3, end: 3 })).toBeNull()
  })
})

describe("saveAnswerSchema", () => {
  const ids = {
    attemptId: "6f1c9a8e-1d2b-4c3d-9e4f-5a6b7c8d9e0f",
    questionId: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  }

  it("trims answers and accepts up to five values", () => {
    const parsed = saveAnswerSchema.parse({ ...ids, response: ["  solar energy "] })
    expect(parsed.response).toEqual(["solar energy"])
    expect(
      saveAnswerSchema.safeParse({ ...ids, response: ["A", "B", "C", "D", "E"] }).success,
    ).toBe(true)
  })

  it("rejects bad ids, blank values and too many values", () => {
    expect(saveAnswerSchema.safeParse({ ...ids, attemptId: "x", response: [] }).success).toBe(false)
    expect(saveAnswerSchema.safeParse({ ...ids, response: ["  "] }).success).toBe(false)
    expect(
      saveAnswerSchema.safeParse({ ...ids, response: ["A", "B", "C", "D", "E", "F"] }).success,
    ).toBe(false)
  })
})
