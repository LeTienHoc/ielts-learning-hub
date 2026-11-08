import { describe, expect, it } from "vitest"

import { practiceSetSourceSchema } from "@/lib/content/practice-set-schema"

import {
  buildPracticeSetSql,
  buildSeedSql,
  contentUuid,
  locateEvidence,
  sql,
} from "../../../scripts/content-seed.mts"

const set = practiceSetSourceSchema.parse({
  slug: "seed-sample",
  title: "It's a sample",
  level: "B2",
  topics: ["cities"],
  source: "original",
  reviewStatus: "published",
  module: "reading",
  testTimeLimitMinutes: 20,
  passage: { title: "Passage", text: "Roofs are hot. Plants cool roofs." },
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
  ],
})

describe("contentUuid", () => {
  it("is stable and has the version 5 layout", () => {
    const id = contentUuid("practice-set:x")
    expect(contentUuid("practice-set:x")).toBe(id)
    expect(contentUuid("practice-set:y")).not.toBe(id)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe("sql", () => {
  it("quotes strings and doubles single quotes", () => {
    expect(sql("It's")).toBe("'It''s'")
  })

  it("writes null, integers and text arrays", () => {
    expect(sql(undefined)).toBe("null")
    expect(sql(null)).toBe("null")
    expect(sql(1200)).toBe("1200")
    expect(sql(["a", "b'c"])).toBe("array['a', 'b''c']::text[]")
  })

  it("rejects non-integer numbers", () => {
    expect(() => sql(1.5)).toThrow("Only integers")
  })
})

describe("locateEvidence", () => {
  it("returns the [start, end) offsets of a unique quote", () => {
    expect(locateEvidence("Roofs are hot. Plants cool roofs.", "Plants")).toEqual({
      start: 15,
      end: 21,
    })
  })

  it("rejects quotes that are missing or ambiguous", () => {
    expect(() => locateEvidence("a b a", "c")).toThrow("not found")
    expect(() => locateEvidence("a b a", "a")).toThrow("more than once")
  })
})

describe("buildPracticeSetSql", () => {
  const output = buildPracticeSetSql(set)

  it("inserts the set, its group, question and hidden answer key", () => {
    expect(output.match(/^insert into public\.\w+/gm)).toEqual([
      "insert into public.content_items",
      "insert into public.practice_sets",
      "insert into public.question_groups",
      "insert into public.questions",
      "insert into public.question_keys",
    ])
  })

  it("escapes text, converts minutes to seconds and fills default options", () => {
    expect(output).toContain("'It''s a sample'")
    expect(output).toContain("'reading', 1200,")
    expect(output).toContain('[{"id":"TRUE","text":"TRUE"}')
  })

  it("stores the evidence offsets", () => {
    expect(output).toMatch(/'Stated\.', null, 15, 33\);/)
  })
})

describe("buildSeedSql", () => {
  it("wraps sets in one transaction", () => {
    const output = buildSeedSql([set])
    expect(output).toMatch(/^-- GENERATED/)
    expect(output).toContain("begin;")
    expect(output.trimEnd().endsWith("commit;")).toBe(true)
  })

  it("rejects duplicate slugs", () => {
    expect(() => buildSeedSql([set, set])).toThrow("Duplicate practice set slug: seed-sample")
  })
})
