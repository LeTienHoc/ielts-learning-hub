"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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
}: UseAttemptAnswersOptions) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [status, setStatus] = useState<SaveStatus>("idle")

  const pending = useRef(new Map<string, string[]>())
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failures = useRef(0)
  const running = useRef<Promise<FlushResult> | null>(null)
  const closed = useRef(false)

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
        continue
      }
      closed.current = true
      onClosedRef.current(result.reason)
      return "closed"
    }
    return "closed"
  }, [attemptId])

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
  const setAnswer = useCallback((questionId: string, response: string[], debounceMs = 0) => {
    if (closed.current) return
    setAnswers((current) => ({ ...current, [questionId]: response }))
    pending.current.set(questionId, response)
    const existing = debounceTimers.current.get(questionId)
    if (existing) clearTimeout(existing)
    debounceTimers.current.set(
      questionId,
      setTimeout(() => {
        debounceTimers.current.delete(questionId)
        void flushRef.current()
      }, debounceMs),
    )
  }, [])

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
