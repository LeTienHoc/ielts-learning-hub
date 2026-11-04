"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { signInAction } from "../actions"
import { signInSchema } from "../schemas/auth-schemas"
import { FormAlert } from "./form-alert"

const LINK_ERRORS: Record<string, string> = {
  link_invalid: "That link is invalid or has expired. Please sign in or request a new link.",
}

export function SignInForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? undefined
  const linkError = LINK_ERRORS[searchParams.get("error") ?? ""] ?? null

  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signInAction(values, next)
      if (!result.ok) setServerError(result.error)
    })
  })

  const message = serverError ?? linkError

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {message && <FormAlert message={message} />}
      <FormField
        control={form.control}
        name="email"
        label="Email"
        render={({ field, controlProps }) => (
          <Input type="email" autoComplete="email" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="password"
        label="Password"
        render={({ field, controlProps }) => (
          <Input type="password" autoComplete="current-password" {...field} {...controlProps} />
        )}
      />
      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-body-sm text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
