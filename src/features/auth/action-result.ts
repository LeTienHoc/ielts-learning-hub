/** Result returned by form Server Actions. Errors are user-safe messages only. */
export type ActionResult = { ok: true } | { ok: false; error: string }

export const GENERIC_ERROR = "Something went wrong. Please try again."
