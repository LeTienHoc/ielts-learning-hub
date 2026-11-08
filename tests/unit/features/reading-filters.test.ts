import { describe, expect, it } from "vitest"

import {
  filterHref,
  filterReadingSets,
  parseReadingFilters,
} from "@/features/reading/utils/filters"

describe("parseReadingFilters", () => {
  it("ignores unknown values", () => {
    expect(parseReadingFilters({ type: "foo", level: "Z9" })).toEqual({})
    expect(parseReadingFilters({ type: ["true_false_not_given", "x"] })).toEqual({})
  })

  it("keeps valid values", () => {
    expect(parseReadingFilters({ type: "true_false_not_given", level: "B1" })).toEqual({
      type: "true_false_not_given",
      level: "B1",
    })
  })
})

describe("filterReadingSets", () => {
  const sets = [
    { id: "a", level: "B1" as const, questionTypes: ["true_false_not_given" as const] },
    {
      id: "b",
      level: "B2" as const,
      questionTypes: ["gap_fill" as const, "true_false_not_given" as const],
    },
  ]

  it("keeps sets matching every filter", () => {
    expect(filterReadingSets(sets, { type: "true_false_not_given" }).map((set) => set.id)).toEqual([
      "a",
      "b",
    ])
    expect(filterReadingSets(sets, { type: "gap_fill" }).map((set) => set.id)).toEqual(["b"])
    expect(filterReadingSets(sets, { level: "C1" })).toEqual([])
  })
})

describe("filterHref", () => {
  it("builds library URLs", () => {
    expect(filterHref({ level: "B1" }, { type: "gap_fill" })).toBe(
      "/reading?type=gap_fill&level=B1",
    )
    expect(filterHref({ level: "B1", type: "gap_fill" }, { type: undefined })).toBe(
      "/reading?level=B1",
    )
    expect(filterHref({ level: "B1" }, { clear: true })).toBe("/reading")
  })
})
