"use client"

import { useCallback, useSyncExternalStore } from "react"
import { z } from "zod"

import { mergeRanges, type TextRange } from "../utils/highlights"

/** Highlights per passage id. Kept on this device only (not synced). */
export type PassageHighlights = Readonly<Record<string, TextRange[]>>

const storedSchema = z.record(
  z.string(),
  z.array(z.object({ start: z.number().int().min(0), end: z.number().int().min(0) })),
)

const EMPTY: PassageHighlights = {}
const storageKey = (attemptId: string) => `ielts-hub:highlights:${attemptId}`

// In-memory copy so highlights still work when storage is blocked or full.
const cache = new Map<string, PassageHighlights>()
const listeners = new Set<() => void>()

function read(attemptId: string): PassageHighlights {
  const cached = cache.get(attemptId)
  if (cached) return cached
  let value: PassageHighlights = EMPTY
  try {
    const raw = window.localStorage.getItem(storageKey(attemptId))
    const parsed = raw ? storedSchema.safeParse(JSON.parse(raw)) : null
    if (parsed?.success) value = parsed.data
  } catch {
    // Blocked storage or unreadable JSON: start without highlights.
  }
  cache.set(attemptId, value)
  return value
}

function write(attemptId: string, value: PassageHighlights) {
  cache.set(attemptId, value)
  try {
    window.localStorage.setItem(storageKey(attemptId), JSON.stringify(value))
  } catch {
    // Blocked or full storage: keep the highlights for this visit only.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The learner's highlights for an attempt, stored on this device. */
export function useHighlights(attemptId: string) {
  const highlights = useSyncExternalStore(
    subscribe,
    () => read(attemptId),
    () => EMPTY,
  )

  const add = useCallback(
    (passageId: string, range: TextRange) => {
      const current = read(attemptId)
      write(attemptId, {
        ...current,
        [passageId]: mergeRanges([...(current[passageId] ?? []), range]),
      })
    },
    [attemptId],
  )

  const clear = useCallback(
    (passageId: string) => {
      const { [passageId]: _removed, ...rest } = read(attemptId)
      write(attemptId, rest)
    },
    [attemptId],
  )

  return { highlights, add, clear }
}
