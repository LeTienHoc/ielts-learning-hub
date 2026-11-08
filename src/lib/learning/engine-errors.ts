/** Error messages raised (SQLSTATE P0001) by the learning engine functions in the database. */
export const ENGINE_ERRORS = [
  "set_not_found",
  "test_mode_unavailable",
  "attempt_not_found",
  "attempt_submitted",
  "attempt_expired",
  "question_not_found",
  "invalid_response",
  "not_authenticated",
  "check_unavailable",
  "answer_locked",
  "word_not_found",
  "word_not_introduced",
  "stale_review",
] as const

/** Engine failures the UI can explain. Anything else is reported as "failed". */
export type EngineErrorCode = (typeof ENGINE_ERRORS)[number] | "failed"

export type EngineResult<T> = { ok: true; value: T } | { ok: false; code: EngineErrorCode }

export function toEngineError(error: { code?: string; message: string }): EngineErrorCode {
  if (error.code !== "P0001") return "failed"
  return ENGINE_ERRORS.find((code) => code === error.message) ?? "failed"
}
