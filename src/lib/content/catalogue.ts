// Catalogue vocabulary shared by every content schema. Mirrors the CHECK constraints on
// public.content_items and public.words. Imported by Node scripts: external packages only.

export const CONTENT_LEVELS = ["A2", "B1", "B2", "C1"] as const
export const CONTENT_TOPICS = [
  "education",
  "environment",
  "technology",
  "health",
  "work",
  "society",
  "culture",
  "media",
  "cities",
  "science",
] as const
export const CONTENT_SOURCES = ["original", "licensed", "ai_assisted"] as const
export const REVIEW_STATUSES = ["draft", "reviewed", "published"] as const

export type ContentLevel = (typeof CONTENT_LEVELS)[number]
export type ContentTopic = (typeof CONTENT_TOPICS)[number]
