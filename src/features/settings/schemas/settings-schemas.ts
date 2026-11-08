import { z } from "zod"

export const EXPLANATION_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
] as const

/** New vocabulary words per day (spec §5.1: small numbers avoid overload). */
export const DAILY_NEW_WORDS_OPTIONS = [5, 10, 15] as const

export const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Use at most 60 characters"),
  explanationLanguage: z.enum(["en", "vi"]),
  dailyNewWords: z.union([z.literal(5), z.literal(10), z.literal(15)]),
})

export const DELETE_CONFIRMATION = "DELETE"

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION, `Type ${DELETE_CONFIRMATION} to confirm`),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
