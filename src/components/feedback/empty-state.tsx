import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** Optional call to action, e.g. a Button. */
  action?: ReactNode
  className?: string
}

/** Standard "nothing here yet" panel for pages and sections without content. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Empty className={cn("rounded-card border border-dashed bg-background py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl bg-primary-subtle text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-h4">{title}</EmptyTitle>
        <EmptyDescription className="text-body-sm">{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
