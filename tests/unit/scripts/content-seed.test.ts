import { describe, expect, it } from "vitest"

import { grammarTopicSourceSchema } from "@/lib/content/grammar-schema"
import { practiceSetSourceSchema } from "@/lib/content/practice-set-schema"
import { vocabularySetSourceSchema } from "@/lib/content/vocabulary-schema"

import { sampleTopic, sampleWord } from "../fixtures/content"
import {
  buildGrammarTopicSql,
  buildPracticeSetSql,
  buildSeedSql,
  buildVocabularySetSql,
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
  passages: [{ title: "Passage", text: "Roofs are hot. Plants cool roofs." }],
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
      "insert into public.practice_set_passages",
      "insert into public.question_groups",
      "insert into public.questions",
      "insert into public.question_keys",
    ])
  })

  it("escapes text, converts minutes to seconds and fills default options", () => {
    expect(output).toContain("'It''s a sample'")
    expect(output).toContain("'reading', 'practice', 1200)")
    expect(output).toContain('[{"id":"TRUE","text":"TRUE"}')
  })

  it("stores the evidence offsets", () => {
    expect(output).toMatch(/'Stated\.', null, 15, 33, null\);/)
  })
})

const vocabularySet = (slug: string, words: ReturnType<typeof sampleWord>[]) =>
  vocabularySetSourceSchema.parse({
    slug,
    title: slug,
    level: "B2",
    topics: ["environment"],
    source: "ai_assisted",
    reviewStatus: "published",
    words,
  })

describe("buildVocabularySetSql", () => {
  it("inserts the set and links its words in order", () => {
    const output = buildVocabularySetSql(
      vocabularySet("environment", [sampleWord("sustainable"), sampleWord("emission")]),
    )
    expect(output).toContain("'vocabulary_set'")
    expect(output).toContain("insert into public.vocabulary_sets")
    expect(output.match(/insert into public\.vocabulary_set_words/g)).toHaveLength(2)
    expect(output).toContain(`'${contentUuid("word:emission")}', 2)`)
  })
})

describe("buildGrammarTopicSql", () => {
  const output = buildGrammarTopicSql(grammarTopicSourceSchema.parse(sampleTopic))

  it("inserts the topic, its grammar practice set and the lesson", () => {
    expect(output).toContain("'grammar_topic'")
    expect(output).toContain(
      `'${contentUuid("practice-set:articles-practice")}', 'grammar', 'practice', null`,
    )
    expect(output).toContain("insert into public.grammar_topics")
    expect(output).toContain('"introVi":"Mạo từ là những từ nhỏ nhưng việc to."')
  })

  it("turns a Spot-the-mistake sentence into word options with the wrong word as the key", () => {
    expect(output).toContain(
      '[{"id":"t1","text":"She"},{"id":"t2","text":"is"},{"id":"t3","text":"a"}',
    )
    expect(output).toContain(
      `'["t3"]'::jsonb, 'Honest starts with a vowel sound.', null, null, null, 'She is an honest student.'`,
    )
  })
})

describe("buildSeedSql", () => {
  const empty = { practiceSets: [], vocabularySets: [], grammarTopics: [] }

  it("wraps everything in one transaction", () => {
    const output = buildSeedSql({ ...empty, practiceSets: [set] })
    expect(output).toMatch(/^-- GENERATED/)
    expect(output).toContain("begin;")
    expect(output.trimEnd().endsWith("commit;")).toBe(true)
  })

  it("rejects duplicate practice set slugs", () => {
    expect(() => buildSeedSql({ ...empty, practiceSets: [set, set] })).toThrow(
      "Duplicate practice set slug: seed-sample",
    )
  })

  it("inserts a word shared by two sets once", () => {
    const output = buildSeedSql({
      ...empty,
      vocabularySets: [
        vocabularySet("environment", [sampleWord("sustainable")]),
        vocabularySet("cities", [sampleWord("sustainable")]),
      ],
    })
    expect(output.match(/insert into public\.words /g)).toHaveLength(1)
    expect(output.match(/insert into public\.vocabulary_set_words/g)).toHaveLength(2)
  })

  it("rejects conflicting definitions of the same word", () => {
    expect(() =>
      buildSeedSql({
        ...empty,
        vocabularySets: [
          vocabularySet("environment", [sampleWord("sustainable")]),
          vocabularySet("cities", [sampleWord("sustainable", { meaningVi: "khác" })]),
        ],
      }),
    ).toThrow('Conflicting definitions for word "sustainable"')
  })
})

describe("passages and key words", () => {
  const withKeyWord = practiceSetSourceSchema.parse({
    slug: "seed-passages",
    title: "Passages",
    level: "B2",
    source: "original",
    reviewStatus: "published",
    module: "reading",
    passages: [
      {
        title: "One",
        text: "Cities need sustainable transport.",
        keyWords: [{ form: "sustainable", word: sampleWord("sustainable") }],
      },
    ],
    groups: [
      {
        type: "short_answer",
        instructions: "Answer.",
        questions: [
          { number: 1, prompt: "What?", accepted: ["transport"], explanation: "Stated." },
        ],
      },
    ],
  })

  it("writes passages with stable ids and links groups to them", () => {
    const output = buildPracticeSetSql(withKeyWord)
    const passageId = contentUuid("practice-set:seed-passages:passage:1")
    expect(output).toContain(
      `'${passageId}', '${contentUuid("practice-set:seed-passages")}', 1, 'One'`,
    )
    expect(output).toMatch(new RegExp(`question_groups .*\n.*'${passageId}'`))
  })

  it("shares a key word with a vocabulary set and links it to its passage", () => {
    const output = buildSeedSql({
      practiceSets: [withKeyWord],
      vocabularySets: [vocabularySet("environment", [sampleWord("sustainable")])],
      grammarTopics: [],
    })
    expect(output.match(/insert into public\.words /g)).toHaveLength(1)
    expect(output).toContain("insert into public.practice_set_words")
    expect(output).toContain(
      `'${contentUuid("word:sustainable")}', '${contentUuid("practice-set:seed-passages:passage:1")}', 'sustainable'`,
    )
  })
})
