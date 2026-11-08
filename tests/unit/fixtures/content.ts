import type { WordSource } from "@/lib/content/vocabulary-schema"

/** Shared content fixtures for unit tests. */
export function sampleWord(slug: string, overrides: Partial<WordSource> = {}): WordSource {
  return {
    slug,
    lemma: slug.split("-")[0] ?? slug,
    partOfSpeech: "adjective",
    ipa: "/səˈsteɪnəbl/",
    meaningEn: "able to continue without harming the environment",
    meaningVi: "bền vững",
    examples: [
      {
        en: "Cities need sustainable transport.",
        vi: "Thành phố cần giao thông bền vững.",
        cloze: "sustainable",
      },
    ],
    collocations: ["sustainable development"],
    commonMistakes: [],
    level: "B2",
    topics: ["environment"],
    ...overrides,
  }
}

export const sampleTopic = {
  slug: "articles",
  title: "Articles: a, an, the",
  summary: "When to use a, an and the.",
  level: "B1",
  source: "ai_assisted",
  reviewStatus: "published",
  version: 1,
  position: 1,
  lesson: {
    introEn: "Articles are tiny words with big jobs.",
    introVi: "Mạo từ là những từ nhỏ nhưng việc to.",
    sections: [
      {
        heading: "A or an?",
        bodyEn: "Listen to the first sound, not the first letter.",
        bodyVi: "Nghe âm đầu, đừng nhìn chữ cái đầu.",
        examples: [{ en: "an hour", note: "h is silent" }],
      },
    ],
    commonMistakes: [
      { wrong: "a honest man", right: "an honest man", whyEn: "Silent h.", whyVi: "Chữ h câm." },
    ],
    ieltsTipEn: "Check articles before you finish Writing Task 2.",
    ieltsTipVi: "Soát mạo từ trước khi nộp Writing Task 2.",
  },
  practice: {
    groups: [
      {
        type: "error_correction",
        instructions: "Tap the mistake.",
        questions: [
          {
            number: 1,
            prompt: "She is a honest student.",
            accepted: ["a"],
            correction: "She is an honest student.",
            explanation: "Honest starts with a vowel sound.",
          },
        ],
      },
      {
        type: "sentence_transformation",
        instructions: "Rewrite the sentence.",
        questions: [
          {
            number: 2,
            prompt: "I don't have time, so I don't travel. (If…)",
            accepted: ["If I had time, I would travel."],
            explanation: "Second conditional.",
          },
        ],
      },
    ],
  },
}
