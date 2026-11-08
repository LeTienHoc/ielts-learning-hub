import { cn } from "@/lib/utils"

export type MascotMood = "idle" | "happy" | "thinking" | "cheering"

type MascotProps = {
  mood?: MascotMood
  className?: string
}

/**
 * Pip, the app's original study buddy: a round little character drawn in inline SVG with
 * theme tokens, so it works in light and dark. Purely decorative (hidden from screen readers);
 * the text next to it carries the message.
 */
export function Mascot({ mood = "idle", className }: MascotProps) {
  const eyesClosed = mood === "happy" || mood === "cheering"
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      data-mood={mood}
      className={cn("size-12 shrink-0", className)}
    >
      {mood === "cheering" && (
        <g className="stroke-primary" strokeWidth="3" strokeLinecap="round">
          <line x1="10" y1="30" x2="2" y2="18" />
          <line x1="54" y1="30" x2="62" y2="18" />
        </g>
      )}
      <circle cx="32" cy="36" r="24" className="fill-primary" />
      <circle cx="32" cy="40" r="15" className="fill-primary-subtle" />
      {eyesClosed ? (
        <g className="stroke-background" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M20 31 q4 -4 8 0" />
          <path d="M36 31 q4 -4 8 0" />
        </g>
      ) : (
        <g className="fill-background">
          <circle cx="24" cy="31" r="4" />
          <circle cx="40" cy="31" r="4" />
          <circle
            cx={mood === "thinking" ? 25.5 : 24}
            cy={mood === "thinking" ? 29.5 : 31}
            r="1.8"
            className="fill-foreground"
          />
          <circle
            cx={mood === "thinking" ? 41.5 : 40}
            cy={mood === "thinking" ? 29.5 : 31}
            r="1.8"
            className="fill-foreground"
          />
        </g>
      )}
      {mood === "thinking" ? (
        <path
          d="M27 46 h10"
          className="stroke-primary-subtle-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={mood === "idle" ? "M26 45 q6 4 12 0" : "M24 44 q8 8 16 0"}
          className="stroke-primary-subtle-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      <circle cx="17" cy="40" r="3" className="fill-warning/50" />
      <circle cx="47" cy="40" r="3" className="fill-warning/50" />
      <path
        d="M32 12 q4 -8 10 -6"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
