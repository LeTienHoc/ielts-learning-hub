import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

import type { SaveStatus as Status } from "../hooks/use-attempt-answers"

const CONTENT: Record<
  Exclude<Status, "idle">,
  { icon: typeof Check; text: string; className: string }
> = {
  saving: { icon: Loader2, text: "Saving…", className: "text-muted-foreground" },
  saved: { icon: Check, text: "All answers saved", className: "text-muted-foreground" },
  retrying: {
    icon: CloudOff,
    text: "Offline — answers kept, retrying",
    className: "text-warning-emphasis",
  },
  error: {
    icon: TriangleAlert,
    text: "An answer could not be saved",
    className: "text-error-emphasis",
  },
}

/** Autosave state, announced politely to screen readers. */
export function SaveStatus({ status }: { status: Status }) {
  const content = status === "idle" ? null : CONTENT[status]
  return (
    <p role="status" className="flex min-h-5 items-center gap-1.5 text-caption">
      {content && (
        <>
          <content.icon
            aria-hidden="true"
            className={cn("size-4", content.className, status === "saving" && "animate-spin")}
          />
          <span className={content.className}>{content.text}</span>
        </>
      )}
    </p>
  )
}
