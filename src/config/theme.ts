export const THEMES = ["light", "dark", "system"] as const

export type Theme = (typeof THEMES)[number]
export type ResolvedTheme = Exclude<Theme, "system">

export const THEME_STORAGE_KEY = "ilh-theme"
export const DEFAULT_THEME: Theme = "system"

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
}
