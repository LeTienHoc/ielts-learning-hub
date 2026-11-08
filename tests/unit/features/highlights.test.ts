import { describe, expect, it } from "vitest"

import { clampRange, mergeRanges, segmentText } from "@/features/practice/utils/highlights"

describe("mergeRanges", () => {
  it("sorts, merges overlapping or touching ranges and drops empty ones", () => {
    expect(
      mergeRanges([
        { start: 8, end: 9 },
        { start: 2, end: 5 },
        { start: 4, end: 8 },
        { start: 12, end: 12 },
      ]),
    ).toEqual([{ start: 2, end: 9 }])
  })
})

describe("clampRange", () => {
  it("keeps ranges inside the text", () => {
    expect(clampRange({ start: -4, end: 3 }, 10)).toEqual({ start: 0, end: 3 })
    expect(clampRange({ start: 8, end: 30 }, 10)).toEqual({ start: 8, end: 10 })
    expect(clampRange({ start: 12, end: 30 }, 10)).toBeNull()
  })
})

describe("segmentText", () => {
  const text = "Vegetation cools roofs."

  it("covers the whole text exactly once", () => {
    const segments = segmentText(text, { highlights: [{ start: 0, end: 16 }] })
    expect(segments.map((segment) => segment.text).join("")).toBe(text)
  })

  it("lets a highlight and a key word overlap without nesting", () => {
    const segments = segmentText(text, {
      highlights: [{ start: 0, end: 16 }],
      keyWords: [{ id: "w1", start: 0, end: 10 }],
      evidence: { start: 11, end: 22 },
    })
    expect(segments).toEqual([
      { text: "Vegetation", start: 0, isHighlighted: true, isEvidence: false, keyWordId: "w1" },
      { text: " ", start: 10, isHighlighted: true, isEvidence: false, keyWordId: null },
      { text: "cools", start: 11, isHighlighted: true, isEvidence: true, keyWordId: null },
      { text: " roofs", start: 16, isHighlighted: false, isEvidence: true, keyWordId: null },
      { text: ".", start: 22, isHighlighted: false, isEvidence: false, keyWordId: null },
    ])
  })
})
