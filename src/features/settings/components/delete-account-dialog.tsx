"use client"

import { useId, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { deleteAccountAction } from "../actions"
import { DELETE_CONFIRMATION } from "../schemas/settings-schemas"

/** Permanently deletes the account after the user types the confirmation word. */
export function DeleteAccountDialog() {
  const inputId = useId()
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const confirmed = confirmation === DELETE_CONFIRMATION

  const onDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteAccountAction({ confirmation: DELETE_CONFIRMATION })
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setConfirmation("")
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your profile and learning history. It cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>
            Type <span className="font-mono">{DELETE_CONFIRMATION}</span> to confirm
          </Label>
          <Input
            id={inputId}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="text-body-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={!confirmed || isPending} onClick={onDelete}>
            {isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
