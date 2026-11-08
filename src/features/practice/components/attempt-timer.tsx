"use client"

import { Clock } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { formatDuration } from "../utils/answers"

type AttemptTimerProps = {
  /** Milliseconds left when the server rendered the page (server time is authoritative). */
  initialRemainingMs: number
  onExpire: () => void
}

/** Countdown for test mode. Counts from the server's remaining time, not the device clock. */
export function AttemptTimer({ initialRemainingMs, onExpire }: AttemptTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    // performance.now() is monotonic, so changing the device clock does not affect the timer.
    const endsAt = performance.now() + initialRemainingMs
    let hasExpired = false
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((endsAt - performance.now()) / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0 && !hasExpired) {
        hasExpired = true
        onExpireRef.current()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [initialRemainingMs])

  const isLow = remainingSeconds !== null && remainingSeconds <= 60

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-label tabular-nums",
        isLow ? "bg-warning-subtle text-warning-emphasis" : "bg-muted text-foreground",
      )}
    >
      <Clock aria-hidden="true" className="size-4" />
      <span className="sr-only">Time remaining: </span>
      {/* Announce only the last minute, not every second. */}
      <span aria-live={isLow ? "polite" : "off"}>
        {remainingSeconds === null ? "--:--" : formatDuration(remainingSeconds)}
      </span>
    </div>
  )
}
