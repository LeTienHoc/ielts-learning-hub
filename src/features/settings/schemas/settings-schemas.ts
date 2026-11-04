import { z } from "zod"

export const EXPLANATION_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
] as const

export const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Use at most 60 characters"),
  explanationLanguage: z.enum(["en", "vi"]),
})

export const DELETE_CONFIRMATION = "DELETE"

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION, `Type ${DELETE_CONFIRMATION} to confirm`),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
