import { X } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

type FocusShellProps = {
  title: string
  /** Compact status shown next to the title (e.g. a timer). */
  status?: ReactNode
  exitHref: string
  exitLabel?: string
  /** Sticky bottom bar (e.g. progress and the submit button). */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Distraction-free page frame for practice and test sessions: minimal top bar (title, status,
 * exit), the task area and a sticky footer. No sidebar or global navigation.
 */
export function FocusShell({
  title,
  status,
  exitHref,
  exitLabel = "Exit",
  footer,
  children,
}: FocusShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-label focus:shadow-elevated focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-header w-full max-w-content items-center gap-3 px-4 md:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={exitHref}>
              <X aria-hidden="true" />
              {exitLabel}
            </Link>
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-label text-foreground md:text-body">
            {title}
          </h1>
          {status}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto w-full max-w-content px-4 py-6 md:px-6">{children}</div>
      </main>
      {footer && (
        <footer className="sticky bottom-0 z-20 border-t border-border bg-background">
          <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-3 px-4 py-3 md:px-6">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
