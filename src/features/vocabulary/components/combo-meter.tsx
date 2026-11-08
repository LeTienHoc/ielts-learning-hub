import { Flame } from "lucide-react"

/** Consecutive correct answers in this session; appears from 2 in a row. No effect on grading. */
export function ComboMeter({ combo }: { combo: number }) {
  if (combo < 2) return null
  return (
    <span
      key={combo}
      aria-live="polite"
      className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2.5 py-1 text-label text-warning-emphasis motion-safe:animate-in motion-safe:zoom-in-75"
    >
      <Flame aria-hidden="true" className="size-4" />
      <span className="sr-only">Combo </span>
      <span>x{combo}</span>
    </span>
  )
}
