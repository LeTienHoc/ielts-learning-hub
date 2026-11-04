"use client"

import { RotateCcw } from "lucide-react"
import { useEffect } from "react"

import { ErrorState } from "@/components/feedback/error-state"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log only the digest/message — never user data. Replace with a reporting service later.
    console.error(error.digest ?? error.message)
  }, [error])

  return (
    <ErrorState
      description="This page could not be loaded. Please try again."
      action={
        <Button variant="outline" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      }
    />
  )
}
