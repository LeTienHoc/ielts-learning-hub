"use client"

import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import { ErrorState } from "@/components/feedback/error-state"
import { Button } from "@/components/ui/button"
import { HOME_ROUTE } from "@/config/routes"

export default function FocusError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log only the digest/message — never answers or user data.
    console.error(error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl items-center px-4">
      <ErrorState
        description="This practice session could not be loaded. Your saved answers are safe."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Button asChild variant="ghost">
              <Link href={HOME_ROUTE}>Go to dashboard</Link>
            </Button>
          </div>
        }
      />
    </main>
  )
}
