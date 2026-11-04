import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { HOME_ROUTE, SIGN_IN_ROUTE } from "@/config/routes"
import { safeRedirectPath } from "@/lib/helpers/safe-redirect"
import { recordActivityEvent } from "@/server/activity/record-event"
import { createSupabaseServerClient } from "@/server/database/server-client"

const confirmParamsSchema = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(["email", "signup", "recovery", "email_change", "invite", "magiclink"]),
  next: z.string().optional(),
})

/**
 * Email-link handler (sign-up confirmation and password recovery). Exchanges the token hash
 * for a session cookie, then redirects to a validated internal path.
 */
export async function GET(request: NextRequest) {
  const parsed = confirmParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  const failure = new URL(`${SIGN_IN_ROUTE}?error=link_invalid`, request.url)
  if (!parsed.success) return NextResponse.redirect(failure)

  const { token_hash, type, next } = parsed.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({ type: type satisfies EmailOtpType, token_hash })
  if (error) return NextResponse.redirect(failure)

  if (type === "email" || type === "signup") {
    await recordActivityEvent(supabase, { type: "auth.email_confirmed", module: "auth" })
  }

  return NextResponse.redirect(new URL(safeRedirectPath(next, HOME_ROUTE), request.url))
}
