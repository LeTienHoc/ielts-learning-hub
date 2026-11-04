"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { requestPasswordResetAction } from "../actions"
import { forgotPasswordSchema } from "../schemas/auth-schemas"
import { FormAlert } from "./form-alert"

export function ForgotPasswordForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setResult(null)
    startTransition(async () => {
      const response = await requestPasswordResetAction(values)
      setResult(
        response.ok
          ? {
              ok: true,
              message:
                "If an account exists for that email, we've sent a link to reset the password.",
            }
          : { ok: false, message: response.error },
      )
    })
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {result && <FormAlert variant={result.ok ? "success" : "error"} message={result.message} />}
      <FormField
        control={form.control}
        name="email"
        label="Email"
        render={({ field, controlProps }) => (
          <Input type="email" autoComplete="email" {...field} {...controlProps} />
        )}
      />
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  )
}
