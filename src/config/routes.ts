/** Default destination after sign-in (kept here so the proxy does not import UI config). */
export const HOME_ROUTE = "/dashboard"

/** Where unauthenticated users are sent. */
export const SIGN_IN_ROUTE = "/sign-in"

/** Pages only for signed-out users; signed-in users are redirected home. */
export const AUTH_ONLY_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"] as const

/**
 * Routes reachable without a session. Everything else requires sign-in (deny by default).
 * `/auth/*` handles email-link confirmation; `/reset-password` checks its own recovery session.
 */
const PUBLIC_ROUTES = ["/", ...AUTH_ONLY_ROUTES, "/api/health"] as const
/** Directory prefixes (must end with "/" so look-alikes such as "/authors" stay protected). */
const PUBLIC_PREFIXES = ["/auth/"] as const

function matches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

export function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => matches(pathname, route))
}

export type RouteDecision = { type: "next" } | { type: "redirect"; to: string }

/**
 * Optimistic routing decision made in the proxy from the session cookie.
 * Real authorization happens in the data access layer (src/server/auth).
 */
export function decideRoute(pathname: string, search: string, isSignedIn: boolean): RouteDecision {
  if (isSignedIn && isAuthOnlyRoute(pathname)) return { type: "redirect", to: HOME_ROUTE }
  if (pathname === "/reset-password") return { type: "next" }
  if (!isSignedIn && !isPublicRoute(pathname)) {
    const next = encodeURIComponent(`${pathname}${search}`)
    return { type: "redirect", to: `${SIGN_IN_ROUTE}?next=${next}` }
  }
  return { type: "next" }
}
