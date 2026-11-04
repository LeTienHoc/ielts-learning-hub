import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/shared/brand-mark"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Button } from "@/components/ui/button"
import { APP_DESCRIPTION } from "@/config/site"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="mx-auto flex h-header w-full max-w-content items-center justify-between gap-2 px-4 md:px-6">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center"
      >
        <h1 className="text-h1 text-foreground md:text-display">
          Learn English. Reach your IELTS goal.
        </h1>
        <p className="text-body-lg text-muted-foreground">{APP_DESCRIPTION}</p>
        <Button size="lg" asChild>
          <Link href="/sign-up">
            Get started
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </Button>
      </main>
    </div>
  )
}
