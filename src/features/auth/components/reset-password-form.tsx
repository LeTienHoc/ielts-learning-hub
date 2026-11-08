"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { navigateWithFullReload } from "@/lib/helpers/full-page-navigation"

import { resetPasswordAction } from "../actions"
import { resetPasswordSchema } from "../schemas/auth-schemas"
import { FormAlert } from "./form-alert"

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await resetPasswordAction(values)
      if (result.ok) navigateWithFullReload(result.redirectTo)
      else setServerError(result.error)
    })
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {serverError && <FormAlert message={serverError} />}
      <FormField
        control={form.control}
        name="password"
        label="New password"
        description="At least 8 characters."
        render={({ field, controlProps }) => (
          <Input type="password" autoComplete="new-password" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="confirmPassword"
        label="Confirm new password"
        render={({ field, controlProps }) => (
          <Input type="password" autoComplete="new-password" {...field} {...controlProps} />
        )}
      />
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  )
}
