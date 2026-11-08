"use client"

import { Mascot } from "@/components/shared/mascot"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

import type { SessionSummary } from "../utils/review-session"
import { SessionDone } from "./session-done"

const CONFETTI_COLOURS = ["bg-primary", "bg-success", "bg-warning", "bg-info"] as const
// Fixed positions (no randomness during render): left offset %, delay ms, colour index.
const CONFETTI = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 37) % 100,
  delay: (index * 83) % 600,
  colour: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length],
}))

function cheer(summary: SessionSummary): string {
  if (summary.reviewed === 0) return "Nothing due right now. Your words are resting."
  if (summary.bestCombo >= 5) return `${summary.bestCombo} right in a row. You're on fire!`
  return "Nice work. A little every day really adds up."
}

/** End-of-session celebration: mascot, a short burst of confetti and the calm summary. */
export function SessionCelebration({ summary }: { summary: SessionSummary }) {
  const isReducedMotion = useReducedMotion()
  return (
    <div className="relative flex flex-col items-center gap-4">
      {!isReducedMotion && (
        <div
          data-confetti
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible"
        >
          {CONFETTI.map((piece) => (
            <span
              key={`${piece.left}-${piece.delay}`}
              className={cn("absolute top-0 size-2 animate-confetti rounded-sm", piece.colour)}
              // Per-piece position and timing; no token covers these values.
              style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}ms` }}
            />
          ))}
        </div>
      )}
      <Mascot mood="cheering" className="size-20" />
      <p className="text-body text-foreground">{cheer(summary)}</p>
      <SessionDone summary={summary} />
    </div>
  )
}
