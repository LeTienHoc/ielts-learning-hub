import { ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"

import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Button } from "@/components/ui/button"
import { HOME_ROUTE } from "@/config/navigation"
import { APP_DESCRIPTION, APP_NAME } from "@/config/site"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="mx-auto flex h-header w-full max-w-content items-center justify-between px-4 md:px-6">
        <span className="flex items-center gap-3 text-label font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          {APP_NAME}
        </span>
        <ThemeSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-h1 text-foreground md:text-display">
          Learn English. Reach your IELTS goal.
        </h1>
        <p className="text-body-lg text-muted-foreground">{APP_DESCRIPTION}</p>
        <Button size="lg" asChild>
          <Link href={HOME_ROUTE}>
            Open dashboard
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      </main>
    </div>
  )
}
