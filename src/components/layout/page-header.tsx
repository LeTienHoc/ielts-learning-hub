import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  /** Page-level actions, aligned to the right on wider screens. */
  actions?: ReactNode
}

/** Title block at the top of every application page. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h3 text-foreground md:text-h2">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
