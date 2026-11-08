import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { SIGN_IN_ROUTE } from "@/config/routes"
import { createSupabaseServerClient } from "@/server/database/server-client"

/** The narrow user shape exposed to the app. Never pass the raw session to the client. */
export type CurrentUser = {
  id: string
  email: string
  displayName: string | null
  explanationLanguage: "en" | "vi"
  /** New vocabulary words per day (5, 10 or 15). */
  dailyNewWords: 5 | 10 | 15
}

/**
 * Data Access Layer entry point: the verified current user, or null.
 * Memoised per request. Reads cookies, so callers must render inside <Suspense>.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (claimsError || !userId) return null

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, explanation_language, daily_new_words")
    .eq("id", userId)
    .maybeSingle()
  if (profileError) throw new Error("Could not load the user profile.")

  const email = typeof claimsData.claims.email === "string" ? claimsData.claims.email : ""

  return {
    id: userId,
    email,
    displayName: profile?.display_name ?? null,
    explanationLanguage: profile?.explanation_language === "vi" ? "vi" : "en",
    dailyNewWords:
      profile?.daily_new_words === 5 || profile?.daily_new_words === 15
        ? profile.daily_new_words
        : 10,
  }
})

/** Like getCurrentUser but redirects to sign-in when there is no session. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(SIGN_IN_ROUTE)
  return user
}
