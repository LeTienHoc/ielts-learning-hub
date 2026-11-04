import { NextResponse, type NextRequest } from "next/server"

import { decideRoute } from "@/config/routes"
import { updateSession } from "@/server/auth/update-session"

/**
 * Runs before every matched request: refreshes the Supabase session cookie and applies
 * optimistic auth redirects. This is not the authorization boundary — data access in
 * src/server/** checks the user again.
 */
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request)
  const decision = decideRoute(request.nextUrl.pathname, request.nextUrl.search, isSignedIn)

  if (decision.type === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url))
    // Keep refreshed auth cookies on the redirect response.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  }
  return response
}

export const config = {
  // Skip static assets and image optimisation; everything else (pages, actions, API) runs here.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
