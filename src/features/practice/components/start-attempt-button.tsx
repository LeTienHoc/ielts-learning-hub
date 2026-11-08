"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

import { startAttemptAction } from "../actions"
import type { AttemptMode } from "../types"

type StartAttemptButtonProps = {
  practiceSetId: string
  mode: AttemptMode
  /** Builds the attempt URL for the module (e.g. /reading/<slug>/attempt/<id>). */
  attemptHrefPrefix: string
  variant?: "default" | "outline"
  children: ReactNode
}

/** Starts (or resumes) an attempt on the server, then opens it. */
export function StartAttemptButton({
  practiceSetId,
  mode,
  attemptHrefPrefix,
  variant = "default",
  children,
}: StartAttemptButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const start = () =>
    startTransition(async () => {
      setError(null)
      const result = await startAttemptAction({ practiceSetId, mode })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`${attemptHrefPrefix}/${result.attemptId}`)
    })

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant={variant} onClick={start} disabled={isPending}>
        {isPending ? "Starting…" : children}
      </Button>
      {error && (
        <p role="alert" className="text-body-sm text-error-emphasis">
          {error}
        </p>
      )}
    </div>
  )
}
