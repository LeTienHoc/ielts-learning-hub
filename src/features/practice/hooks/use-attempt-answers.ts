"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { z } from "zod"

import type { SaveAnswerInput } from "../schemas/practice-schemas"
import type { Answers } from "../utils/answers"

export type SaveStatus = "idle" | "saving" | "saved" | "retrying" | "error"

/** Outcome of saving everything pending: saved (rejected answers are dropped), still pending (will retry) or closed by the server. */
export type FlushResult = "saved" | "pending" | "closed"

type SaveResult =
  { ok: true } | { ok: false; reason: "retry" | "expired" | "submitted" | "rejected" }

type UseAttemptAnswersOptions = {
  attemptId: string
  initialAnswers: Answers
  saveAnswer: (input: SaveAnswerInput) => Promise<SaveResult>
  /** The server closed the attempt (deadline passed or already submitted). */
  onClosed: (reason: "expired" | "submitted") => void
  /**
   * Storage key for answers not yet saved. They are kept on the device, restored and sent on
   * the next visit (e.g. after the tab was closed while offline), and removed once saved or
   * once the attempt is closed.
   */
  persistKey?: string
  /** When the server last saved each answer (ISO time); a newer server answer wins. */
  initialSavedAt?: Readonly<Record<string, string>>
}

type StoredAnswer = { response: string[]; savedAt: string }

const storedAnswersSchema = z.record(
  z.string(),
  z.object({ response: z.array(z.string()), savedAt: z.iso.datetime() }),
)

function readStored(key: string): Record<string, StoredAnswer> {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? storedAnswersSchema.safeParse(JSON.parse(raw)) : null
    return parsed?.success ? parsed.data : {}
  } catch {
    // Blocked storage or unreadable JSON: nothing to restore.
    return {}
  }
}

function writeStored(key: string, answers: ReadonlyMap<string, StoredAnswer>) {
  try {
    if (answers.size === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(Object.fromEntries(answers)))
  } catch {
    // Blocked or full storage: answers are still saved to the server as usual.
  }
}

/** Delay before retrying a failed save; grows with each consecutive failure. */
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000] as const

/**
 * Answer state for an attempt with autosave. Each question keeps only its newest unsaved
 * value; saves run one at a time; temporary failures are retried with backoff (and when the
 * browser comes back online), so answers survive a short loss of connection.
 */
export function useAttemptAnswers({
  attemptId,
  initialAnswers,
  saveAnswer,
  onClosed,
  persistKey,
  initialSavedAt,
}: UseAttemptAnswersOptions) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [status, setStatus] = useState<SaveStatus>("idle")

  const pending = useRef(new Map<string, string[]>())
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failures = useRef(0)
  const running = useRef<Promise<FlushResult> | null>(null)
  const closed = useRef(false)
  // Answers not yet confirmed by the server (mirrored to storage when persistKey is set).
  const unsaved = useRef(new Map<string, StoredAnswer>())

  const markSaved = useCallback(
    (questionId: string, response: string[]) => {
      // Only if the learner has not changed it since.
      if (unsaved.current.get(questionId)?.response !== response) return
      unsaved.current.delete(questionId)
      if (persistKey) writeStored(persistKey, unsaved.current)
    },
    [persistKey],
  )

  /** The attempt is closed: nothing on this device can be saved any more. */
  const forgetUnsaved = useCallback(() => {
    unsaved.current.clear()
    if (persistKey) writeStored(persistKey, unsaved.current)
  }, [persistKey])

  // Kept in refs so the save loop always calls the latest callbacks.
  const saveRef = useRef(saveAnswer)
  const onClosedRef = useRef(onClosed)
  useEffect(() => {
    saveRef.current = saveAnswer
    onClosedRef.current = onClosed
  })

  const flushRef = useRef<() => Promise<FlushResult>>(() => Promise.resolve("saved"))

  const drain = useCallback(async (): Promise<FlushResult> => {
    let hasRejected = false
    while (!closed.current) {
      const next = pending.current.entries().next()
      if (next.done) {
        setStatus(hasRejected ? "error" : "saved")
        return "saved"
      }
      const [questionId, response] = next.value
      pending.current.delete(questionId)
      setStatus("saving")

      let result: SaveResult
      try {
        result = await saveRef.current({ attemptId, questionId, response })
      } catch {
        // Network or server failure before a result: treat as temporary.
        result = { ok: false, reason: "retry" }
      }

      if (result.ok) {
        failures.current = 0
        markSaved(questionId, response)
        continue
      }
      if (result.reason === "retry") {
        // Keep the answer unless the learner has already changed it again.
        if (!pending.current.has(questionId)) pending.current.set(questionId, response)
        const delay = RETRY_DELAYS_MS[Math.min(failures.current, RETRY_DELAYS_MS.length - 1)]
        failures.current += 1
        setStatus("retrying")
        retryTimer.current = setTimeout(() => void flushRef.current(), delay)
        return "pending"
      }
      if (result.reason === "rejected") {
        // Not retryable (invalid answer or ended session); report it and save the rest.
        hasRejected = true
        markSaved(questionId, response)
        continue
      }
      closed.current = true
      forgetUnsaved()
      onClosedRef.current(result.reason)
      return "closed"
    }
    return "closed"
  }, [attemptId, markSaved, forgetUnsaved])

  /** Saves everything pending now and reports the outcome. */
  const flush = useCallback((): Promise<FlushResult> => {
    for (const timer of debounceTimers.current.values()) clearTimeout(timer)
    debounceTimers.current.clear()
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
    if (!running.current) {
      running.current = drain().finally(() => {
        running.current = null
      })
    }
    return running.current
  }, [drain])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  /** Records an answer and schedules its save (immediately for choices, after typing pauses for text). */
  const setAnswer = useCallback(
    (questionId: string, response: string[], debounceMs = 0) => {
      if (closed.current) return
      setAnswers((current) => ({ ...current, [questionId]: response }))
      pending.current.set(questionId, response)
      unsaved.current.set(questionId, { response, savedAt: new Date().toISOString() })
      if (persistKey) writeStored(persistKey, unsaved.current)
      const existing = debounceTimers.current.get(questionId)
      if (existing) clearTimeout(existing)
      debounceTimers.current.set(
        questionId,
        setTimeout(() => {
          debounceTimers.current.delete(questionId)
          void flushRef.current()
        }, debounceMs),
      )
    },
    [persistKey],
  )

  // Answers left unsaved on this device last time are sent now, unless the server already has
  // a newer answer (saved later, e.g. from another device).
  const savedAtRef = useRef(initialSavedAt)
  useEffect(() => {
    if (!persistKey) return
    for (const [questionId, stored] of Object.entries(readStored(persistKey))) {
      const serverSavedAt = savedAtRef.current?.[questionId]
      if (serverSavedAt && Date.parse(serverSavedAt) >= Date.parse(stored.savedAt)) continue
      setAnswer(questionId, stored.response)
    }
    // Drop the copies that were not restored.
    writeStored(persistKey, unsaved.current)
  }, [persistKey, setAnswer])

  useEffect(() => {
    const onOnline = () => {
      if (pending.current.size > 0) void flushRef.current()
    }
    window.addEventListener("online", onOnline)
    const timers = debounceTimers.current
    return () => {
      window.removeEventListener("online", onOnline)
      for (const timer of timers.values()) clearTimeout(timer)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [])

  return { answers, setAnswer, flush, status }
}
