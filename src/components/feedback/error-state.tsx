import { TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type ErrorStateProps = {
  title?: string
  description?: string
  /** Recovery action, e.g. a "Try again" button. */
  action?: ReactNode
}

/** Standard panel for recoverable errors (route error boundaries, failed queries). */
export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  action,
}: ErrorStateProps) {
  return (
    <Empty role="alert" className="rounded-card border border-error/30 bg-background py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl bg-error-subtle text-error">
          <TriangleAlert aria-hidden="true" className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-h4">{title}</EmptyTitle>
        <EmptyDescription className="text-body-sm">{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
