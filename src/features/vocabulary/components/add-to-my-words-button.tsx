"use client"

import { Check, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

import { addSetToMyWordsAction, addWordToMyWordsAction } from "../actions"

type AddToMyWordsButtonProps = { kind: "set" | "word"; id: string; isAdded: boolean }

/** Adds a whole set or one word to My words. New words are introduced later, a few per day. */
export function AddToMyWordsButton({ kind, id, isAdded }: AddToMyWordsButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isAdded) {
    return (
      <p className="flex items-center gap-1.5 text-body-sm text-success-emphasis">
        <Check aria-hidden="true" className="size-4" />
        {kind === "set" ? "All words are in My words" : "In My words"}
      </p>
    )
  }

  const add = () =>
    startTransition(async () => {
      setError(null)
      const result =
        kind === "set" ? await addSetToMyWordsAction(id) : await addWordToMyWordsAction(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={add} disabled={isPending} className="self-start">
        <Plus aria-hidden="true" />
        {isPending ? "Adding…" : kind === "set" ? "Start learning this set" : "Add to My words"}
      </Button>
      {error && (
        <p role="alert" className="text-body-sm text-error-emphasis">
          {error}
        </p>
      )}
    </div>
  )
}
