/** Result returned by form Server Actions. Errors are user-safe messages only. */
export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Result of an action that changes the auth state. The client follows `redirectTo` with a
 * full page load (see navigateWithFullReload); the path is already validated on the server.
 */
export type RedirectActionResult = { ok: true; redirectTo: string } | { ok: false; error: string }

export const GENERIC_ERROR = "Something went wrong. Please try again."
